"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addCompanionAction(targetUserId: string, username: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id === targetUserId) return;
  await supabase.from("follows").insert({ follower_id: user.id, followee_id: targetUserId });
  revalidatePath(`/u/${username}`);
  revalidatePath("/companions");
}

export async function removeCompanionAction(targetUserId: string, username: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", targetUserId);
  revalidatePath(`/u/${username}`);
  revalidatePath("/companions");
}
