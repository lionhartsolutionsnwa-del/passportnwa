"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) throw new Error("Admin only");
  return { supabase, userId: user.id };
}

export async function createAnnouncementAction(formData: FormData) {
  const { supabase, userId } = await admin();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) throw new Error("Message required");

  const endsAtStr = String(formData.get("ends_at") ?? "").trim();
  const { error } = await supabase.from("announcements").insert({
    message,
    link_url:   String(formData.get("link_url") ?? "").trim() || null,
    link_label: String(formData.get("link_label") ?? "").trim() || null,
    ends_at:    endsAtStr ? new Date(endsAtStr).toISOString() : null,
    created_by: userId,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}

export async function toggleAnnouncementAction(id: string, makeActive: boolean) {
  const { supabase } = await admin();
  const { error } = await supabase.from("announcements").update({ is_active: makeActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}

export async function deleteAnnouncementAction(id: string) {
  const { supabase } = await admin();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}
