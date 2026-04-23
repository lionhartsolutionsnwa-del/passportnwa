"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deletePostAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) throw new Error("Admin only");

  const admin = createAdminClient();
  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
  revalidatePath("/");
}
