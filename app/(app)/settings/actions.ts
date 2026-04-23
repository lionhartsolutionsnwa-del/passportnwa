"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export async function saveProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = String(formData.get("username") ?? "").trim();
  if (!USERNAME_RE.test(username)) throw new Error("Invalid username");

  const display_name = String(formData.get("display_name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const favoritesRaw = String(formData.get("favorites") ?? "");
  const favorite_restaurant_ids = favoritesRaw
    ? favoritesRaw.split(",").filter(Boolean).slice(0, 3)
    : [];

  // Avatar upload (optional)
  const avatar = formData.get("avatar") as File | null;
  let avatar_url: string | undefined;
  if (avatar && avatar.size > 0) {
    const ext = (avatar.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { contentType: avatar.type, upsert: true });
    if (upErr) throw new Error(`Avatar upload failed: ${upErr.message}`);
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatar_url = pub.publicUrl;
  }

  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email_marketing_consent = formData.get("email_marketing_consent") === "on";
  const sms_marketing_consent   = formData.get("sms_marketing_consent") === "on" && !!phone;

  const row: Record<string, unknown> = {
    id: user.id,
    username,
    display_name,
    bio,
    phone,
    email_marketing_consent,
    sms_marketing_consent,
    consent_updated_at: new Date().toISOString(),
    favorite_restaurant_ids,
  };
  if (avatar_url) row.avatar_url = avatar_url;

  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) {
    if (error.code === "23505") throw new Error("That username is already taken.");
    throw new Error(error.message);
  }

  revalidatePath(`/u/${username}`);
  revalidatePath("/settings");
  redirect(`/u/${username}`);
}
