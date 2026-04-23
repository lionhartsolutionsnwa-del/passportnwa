"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) throw new Error("Admin only");
  return { admin: createAdminClient(), adminId: user.id };
}

export async function toggleAdminAction(userId: string, makeAdmin: boolean) {
  const { admin } = await requireAdmin();
  await admin.from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function toggleSuspendAction(userId: string, suspend: boolean, formData: FormData) {
  const { admin } = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  await admin.from("profiles").update({
    is_suspended: suspend,
    suspended_reason: suspend ? reason : null,
    suspended_at: suspend ? new Date().toISOString() : null,
  }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function sendPasswordResetAction(userId: string) {
  const { admin } = await requireAdmin();
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) throw new Error("No email on file");
  // Uses Supabase's configured SMTP (Resend) to deliver
  const { error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function deleteUserAction(userId: string) {
  const { admin } = await requireAdmin();
  // Cascades across profiles/checkins/posts via FK ON DELETE CASCADE
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  redirect("/admin/users");
}
