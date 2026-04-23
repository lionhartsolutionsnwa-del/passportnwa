"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitClaimAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant_id = String(formData.get("restaurant_id") ?? "");
  if (!restaurant_id) throw new Error("Restaurant required");

  const { error } = await supabase.from("restaurant_claims").upsert(
    {
      user_id: user.id,
      restaurant_id,
      role_at_restaurant: String(formData.get("role") ?? "").trim() || null,
      contact_phone: String(formData.get("phone") ?? "").trim() || null,
      message: String(formData.get("message") ?? "").trim() || null,
      status: "pending",
    },
    { onConflict: "user_id,restaurant_id" },
  );
  if (error) throw new Error(error.message);

  // Mark profile as a restaurant owner (pending until claim is approved)
  await supabase.from("profiles").update({ is_restaurant_owner: true }).eq("id", user.id);

  revalidatePath("/claim");
}
