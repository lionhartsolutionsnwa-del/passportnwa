"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPostAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const restaurantId = String(formData.get("restaurant_id") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();
  const photo = formData.get("photo") as File | null;

  if (!restaurantId) throw new Error("Restaurant required");
  if (!caption && !(photo && photo.size > 0)) throw new Error("Add a caption or a photo");

  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    const ext = (photo.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("posts")
      .upload(path, photo, { contentType: photo.type, upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
    const { data: pub } = supabase.storage.from("posts").getPublicUrl(path);
    photo_url = pub.publicUrl;
  }

  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      caption: caption || null,
      photo_url,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Parse @mentions, look up profiles, insert tags
  if (caption) {
    const mentions = Array.from(new Set(caption.match(/@([a-zA-Z0-9_]+)/g) ?? []))
      .map((m) => m.slice(1).toLowerCase());
    if (mentions.length > 0) {
      const { data: tagged } = await supabase
        .from("profiles")
        .select("id, username")
        .in("username", mentions);
      const rows = (tagged ?? []).map((p) => ({
        post_id: inserted!.id,
        tagged_user_id: p.id,
      }));
      if (rows.length > 0) {
        await supabase.from("post_tags").insert(rows);
      }
    }
  }

  revalidatePath("/");
  redirect("/");
}

export async function searchUsersAction(q: string) {
  if (!q || q.length < 1) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username, display_name")
    .ilike("username", `${q}%`)
    .limit(8);
  return data ?? [];
}
