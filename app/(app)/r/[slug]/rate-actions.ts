"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveRatingAction(restaurantId: string, slug: string, rating: number) {
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("restaurant_ratings")
    .upsert(
      { user_id: user.id, restaurant_id: restaurantId, rating },
      { onConflict: "user_id,restaurant_id" },
    );
  if (error) throw new Error(error.message);

  // Dismiss the "rate_restaurant" nudge for this spot if present
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), dismissed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("kind", "rate_restaurant")
    .eq("related_restaurant_id", restaurantId)
    .is("dismissed_at", null);

  revalidatePath(`/r/${slug}`);
  revalidatePath("/notifications");
}
