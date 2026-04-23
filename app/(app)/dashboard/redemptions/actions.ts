"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setStatusAction(
  redemptionId: string,
  decision: "fulfilled" | "cancelled",
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("redemptions")
    .update({
      status: decision,
      fulfilled_by: decision === "fulfilled" ? user.id : null,
      fulfilled_at: decision === "fulfilled" ? new Date().toISOString() : null,
    })
    .eq("id", redemptionId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/redemptions");
}

export async function fulfillByCodeAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Invalid code");

  const { data: match } = await supabase
    .from("redemptions")
    .select("id")
    .eq("code", code)
    .eq("status", "pending")
    .maybeSingle();
  if (!match) throw new Error("No pending redemption with that code");

  const { error } = await supabase
    .from("redemptions")
    .update({ status: "fulfilled", fulfilled_by: user.id, fulfilled_at: new Date().toISOString() })
    .eq("id", match.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/redemptions");
}
