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
  return { supabase, admin: createAdminClient(), userId: user.id };
}

export async function saveRestaurantAction(restaurantId: string, formData: FormData) {
  const { admin } = await requireAdmin();
  const update: Record<string, unknown> = {
    name:            String(formData.get("name") ?? "").trim(),
    cuisine:         String(formData.get("cuisine") ?? "").trim() || null,
    city:            String(formData.get("city") ?? "").trim(),
    address:         String(formData.get("address") ?? "").trim() || null,
    phone:           String(formData.get("phone") ?? "").trim() || null,
    website:         String(formData.get("website") ?? "").trim() || null,
    description:     String(formData.get("description") ?? "").trim() || null,
    cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
  };
  const { error } = await admin.from("restaurants").update(update).eq("id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/restaurants");
}

export async function toggleActiveAction(restaurantId: string, makeActive: boolean) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("restaurants").update({ is_active: makeActive }).eq("id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/restaurants");
}

export async function toggleFeaturedAction(restaurantId: string, makeFeatured: boolean) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("restaurants").update({ is_featured: makeFeatured }).eq("id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/restaurants");
}

export async function removeOwnerAction(restaurantId: string, userId: string) {
  const { admin } = await requireAdmin();
  await admin.from("restaurant_owners").delete().eq("restaurant_id", restaurantId).eq("user_id", userId);
  revalidatePath(`/admin/restaurants`);
}

export async function addOwnerAction(restaurantId: string, formData: FormData) {
  const { admin, userId: adminId } = await requireAdmin();
  const username = String(formData.get("username") ?? "").trim();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!profile) throw new Error(`No user @${username}`);
  await admin.from("restaurant_owners").upsert({
    restaurant_id: restaurantId,
    user_id: profile.id,
    approved_by: adminId,
  });
  await admin.from("profiles").update({ is_restaurant_owner: true }).eq("id", profile.id);
  revalidatePath(`/admin/restaurants`);
}

// Pull fresh Google Places data for a restaurant
export async function refreshFromGoogleAction(restaurantId: string, placeId: string) {
  const { admin } = await requireAdmin();
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("Google Places key missing");

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,addressComponents,types,location,rating,userRatingCount,priceLevel,regularOpeningHours,websiteUri,nationalPhoneNumber,photos",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const p = await res.json();

  const PRICE_MAP: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  const photos = (p.photos ?? [])
    .slice(0, 5)
    .map((ph: any) => `https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=1200&key=${key}`);

  const { error } = await admin.from("restaurants").update({
    rating: p.rating ?? null,
    user_rating_count: p.userRatingCount ?? null,
    price_level: PRICE_MAP[p.priceLevel] ?? null,
    hours_text: p.regularOpeningHours?.weekdayDescriptions ?? null,
    photo_urls: photos,
    cover_image_url: photos[0] ?? null,
    website: p.websiteUri ?? null,
    phone: p.nationalPhoneNumber ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
  }).eq("id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/restaurants");
}
