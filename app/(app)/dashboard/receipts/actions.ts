"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function decideReceiptAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  const points = Math.max(0, Math.min(500, parseInt(String(formData.get("points") ?? "10")) || 0));
  if (!id || (decision !== "approved" && decision !== "rejected")) {
    throw new Error("Invalid decision");
  }

  const { error } = await supabase
    .from("receipts")
    .update({
      status: decision,
      points_awarded: decision === "approved" ? points : 0,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/receipts");
}
