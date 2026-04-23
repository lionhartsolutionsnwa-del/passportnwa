"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireOwner(restaurantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (me?.is_admin) return supabase;
  const { data: ownership } = await supabase
    .from("restaurant_owners")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (!ownership) throw new Error("Not authorized");
  return supabase;
}

export async function createRewardAction(restaurantId: string, formData: FormData) {
  const supabase = await requireOwner(restaurantId);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const points_cost = parseInt(String(formData.get("points_cost") ?? "0"));
  if (!name || !points_cost || points_cost < 1) throw new Error("Name and points cost required");

  const { error } = await supabase.from("rewards").insert({
    restaurant_id: restaurantId,
    name,
    description,
    points_cost,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rewards");
}

export async function toggleRewardAction(rewardId: string, makeActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase
    .from("rewards")
    .update({ is_active: makeActive })
    .eq("id", rewardId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rewards");
}

export async function deleteRewardAction(rewardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("rewards").delete().eq("id", rewardId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rewards");
}
