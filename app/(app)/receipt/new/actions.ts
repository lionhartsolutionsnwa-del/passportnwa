"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitReceiptAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurant_id = String(formData.get("restaurant_id") ?? "");
  if (!restaurant_id) throw new Error("Choose a destination");

  const receipt = formData.get("receipt") as File | null;
  if (!receipt || receipt.size === 0) throw new Error("Attach a receipt photo");

  const amountStr = String(formData.get("amount") ?? "").trim();
  const amount_cents = amountStr ? Math.round(parseFloat(amountStr) * 100) : null;

  // Upload receipt photo to private 'receipts' bucket
  const ext = (receipt.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("receipts")
    .upload(path, receipt, { contentType: receipt.type, upsert: false });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { error } = await supabase.from("receipts").insert({
    user_id: user.id,
    restaurant_id,
    photo_url: path, // stored as path; we'll sign URLs on read
    amount_cents,
    status: "pending",
    points_awarded: 10, // default; reviewer can adjust
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/receipt/submitted");
}
