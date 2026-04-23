"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkInAction(restaurantId: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("checkins")
    .insert({ restaurant_id: restaurantId, user_id: user.id });

  if (error) throw new Error(error.message);

  revalidatePath(`/r/${slug}`);
  revalidatePath("/");
  redirect(`/post/new?r=${slug}&checkedIn=1`);
}
