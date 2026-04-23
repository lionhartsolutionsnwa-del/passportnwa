// Google Places API (New) wrapper — Text Search + Place Details
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

const KEY = process.env.GOOGLE_PLACES_API_KEY;

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
  city: string;
  cuisine: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  phone: string | null;
  photoUrl: string | null;
};

// NWA bounding box (Bentonville/Rogers/Fayetteville/Springdale)
const NWA_BIAS = {
  rectangle: {
    low: { latitude: 35.95, longitude: -94.35 },
    high: { latitude: 36.45, longitude: -94.05 },
  },
};

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY missing");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.types,places.location,places.websiteUri,places.nationalPhoneNumber,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: "restaurant",
      locationBias: NWA_BIAS,
      maxResultCount: 8,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Places API ${res.status}: ${t}`);
  }
  const json = await res.json();
  const places = json.places ?? [];

  return places.map((p: any) => {
    const city =
      p.addressComponents?.find((c: any) => c.types?.includes("locality"))?.longText ?? "";
    const cuisine = (p.types ?? [])
      .filter((t: string) => t.endsWith("_restaurant") && t !== "restaurant")
      .map((t: string) =>
        t.replace("_restaurant", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      )[0] ?? null;
    const photoName = p.photos?.[0]?.name;
    const photoUrl = photoName
      ? `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${KEY}`
      : null;

    return {
      placeId: p.id,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      city,
      cuisine,
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      website: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? null,
      photoUrl,
    } satisfies PlaceSuggestion;
  });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
