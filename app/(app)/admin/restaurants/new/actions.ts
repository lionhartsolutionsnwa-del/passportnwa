"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { searchPlaces, slugify, type PlaceSuggestion } from "@/lib/google-places";

export async function searchAction(q: string): Promise<PlaceSuggestion[]> {
  return searchPlaces(q);
}

export async function createRestaurantAction(
  formData: FormData,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return { ok: false, error: "Admin only" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name required" };
  const city = String(formData.get("city") ?? "").trim();
  if (!city) return { ok: false, error: "City required" };

  const slug = slugify(name);
  const lat = Number(formData.get("lat")) || null;
  const lng = Number(formData.get("lng")) || null;

  const { error } = await supabase.from("restaurants").insert({
    slug,
    name,
    city,
    cuisine: String(formData.get("cuisine") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    google_place_id: String(formData.get("placeId") ?? "") || null,
    cover_image_url: String(formData.get("photoUrl") ?? "") || null,
    website: String(formData.get("website") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    lat,
    lng,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/restaurants");
  return { ok: true, name };
}
