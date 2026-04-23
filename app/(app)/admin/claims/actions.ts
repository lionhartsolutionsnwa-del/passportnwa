"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function decideClaimAction(claimId: string, decision: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) throw new Error("Admin only");

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("restaurant_claims")
    .select("user_id, restaurant_id")
    .eq("id", claimId)
    .single();
  if (!claim) throw new Error("Claim not found");

  await admin
    .from("restaurant_claims")
    .update({ status: decision, decided_at: new Date().toISOString(), decided_by: user.id })
    .eq("id", claimId);

  if (decision === "approved") {
    await admin.from("restaurant_owners").upsert({
      user_id: claim.user_id,
      restaurant_id: claim.restaurant_id,
      approved_by: user.id,
    });
    await admin.from("profiles").update({ is_restaurant_owner: true }).eq("id", claim.user_id);
    // Activate the restaurant if it was created via the owner signup flow as inactive.
    await admin.from("restaurants").update({ is_active: true }).eq("id", claim.restaurant_id);
  }

  revalidatePath("/admin/claims");
}
