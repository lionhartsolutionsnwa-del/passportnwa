"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

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
    await admin.from("restaurants").update({ is_active: true }).eq("id", claim.restaurant_id);

    // Notify applicant
    const { data: authUser } = await admin.auth.admin.getUserById(claim.user_id);
    const email = authUser?.user?.email;
    const { data: rest } = await admin.from("restaurants").select("name").eq("id", claim.restaurant_id).single();
    if (email) {
      await sendEmail({
        to: email,
        subject: `You're approved — ${rest?.name ?? "Passport NWA"}`,
        html: `
          <p>Good news — <strong>${rest?.name ?? "your restaurant"}</strong> is now live on Passport NWA, and you have full Concierge access.</p>
          <p>Sign in at <a href="https://www.passportnwa.com/dashboard">passportnwa.com/dashboard</a> to:</p>
          <ul>
            <li>Download your QR code for the table</li>
            <li>Create rewards travelers can redeem with points</li>
            <li>Review incoming receipts and fulfill redemptions</li>
          </ul>
          <p>Welcome aboard.<br/>— Passport NWA</p>
        `,
      });
    }
  } else {
    const { data: authUser } = await admin.auth.admin.getUserById(claim.user_id);
    const email = authUser?.user?.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: "Your Passport NWA application",
        html: `<p>Thanks for applying. We weren't able to verify your restaurant at this time. If you think this was a mistake or want to reapply with additional documentation, reply to this email.</p><p>— Passport NWA</p>`,
      });
    }
  }

  revalidatePath("/admin/claims");
}
