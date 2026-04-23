"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function redeemRewardAction(rewardId: string, _slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) throw new Error(error.message);

  const redemption = Array.isArray(data) ? data[0] : data;
  redirect(`/redemptions/${redemption.id}`);
}
