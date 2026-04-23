"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function searchRestaurantsAction(q: string) {
  if (!q || q.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, city")
    .eq("is_active", true)
    .ilike("name", `%${q}%`)
    .limit(8);
  return data ?? [];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function submitRestaurantSignupAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email        = String(formData.get("email") ?? "").trim().toLowerCase();
  const password     = String(formData.get("password") ?? "");
  const fullName     = String(formData.get("full_name") ?? "").trim();
  const username     = String(formData.get("username") ?? "").trim();
  const role         = String(formData.get("role") ?? "").trim();
  const ein          = String(formData.get("ein") ?? "").replace(/\s/g, "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const restaurantPhone = String(formData.get("restaurant_phone") ?? "").trim();
  const doc          = formData.get("verification_doc") as File | null;

  const existingRestaurantId = String(formData.get("existing_restaurant_id") ?? "");
  const newName    = String(formData.get("new_restaurant_name") ?? "").trim();
  const newAddress = String(formData.get("new_restaurant_address") ?? "").trim();
  const newCity    = String(formData.get("new_restaurant_city") ?? "").trim();

  // Validate
  if (!/^\S+@\S+\.\S+$/.test(email))             return { ok: false, error: "Invalid email" };
  if (password.length < 8)                        return { ok: false, error: "Password must be 8+ characters" };
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username))    return { ok: false, error: "Invalid username" };
  if (!fullName || !role)                         return { ok: false, error: "Missing owner information" };
  if (!businessName || !restaurantPhone)         return { ok: false, error: "Missing business information" };
  if (!/^\d{2}-?\d{7}$/.test(ein))               return { ok: false, error: "EIN must be 9 digits (XX-XXXXXXX)" };
  if (!doc || doc.size === 0)                    return { ok: false, error: "Proof document required" };
  if (!existingRestaurantId && !newName)         return { ok: false, error: "Choose a restaurant or add a new one" };

  const admin = createAdminClient();

  // 1) Create auth user (admin client — skip email confirmation step, we'll just let them log in)
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: fullName },
  });
  if (authErr || !created.user) {
    return { ok: false, error: authErr?.message ?? "Could not create account" };
  }
  const userId = created.user.id;

  // 2) Ensure profile row
  const emailMarketingConsent = formData.get("email_marketing_consent") === "on";
  const smsMarketingConsent   = formData.get("sms_marketing_consent") === "on";
  await admin.from("profiles").upsert(
    {
      id: userId,
      username,
      display_name: fullName,
      phone: restaurantPhone,
      is_restaurant_owner: true,
      email_marketing_consent: emailMarketingConsent,
      sms_marketing_consent: smsMarketingConsent && !!restaurantPhone,
      consent_updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  // 3) Determine restaurant — existing or create inactive one
  let restaurantId = existingRestaurantId;
  if (!restaurantId) {
    const slug = `${slugify(newName)}-${Date.now().toString(36)}`;
    const { data: inserted, error: restErr } = await admin
      .from("restaurants")
      .insert({
        slug,
        name: newName,
        city: newCity || "Bentonville",
        address: newAddress || null,
        phone: restaurantPhone,
        is_active: false, // pending admin review
      })
      .select("id")
      .single();
    if (restErr || !inserted) {
      await admin.auth.admin.deleteUser(userId);
      return { ok: false, error: `Could not add restaurant: ${restErr?.message ?? "unknown"}` };
    }
    restaurantId = inserted.id;
  }

  // 4) Upload verification doc
  const ext = (doc.name.split(".").pop() ?? "bin").toLowerCase();
  const docPath = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("verification")
    .upload(docPath, doc, { contentType: doc.type, upsert: false });
  if (upErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: `Document upload failed: ${upErr.message}` };
  }

  // 5) Create claim
  const { error: claimErr } = await admin.from("restaurant_claims").insert({
    user_id: userId,
    restaurant_id: restaurantId,
    role_at_restaurant: role,
    owner_full_name: fullName,
    business_legal_name: businessName,
    ein,
    contact_phone: restaurantPhone,
    verification_doc_path: docPath,
    status: "pending",
  });
  if (claimErr) {
    return { ok: false, error: `Could not save application: ${claimErr.message}` };
  }

  redirect("/restaurant-signup/pending");
}
