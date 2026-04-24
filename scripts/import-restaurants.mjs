// Import NWA restaurants from Google Places (New) into Supabase.
// Filter: rating >= 4.0 AND userRatingCount >= 50.
// Run: npm run import-restaurants

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { isBlocked } from "./chain-blocklist.mjs";

// --- Load .env.local manually (Node doesn't read it automatically) ---
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY || !PLACES_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- Search queries: cover every NWA municipality ---
const QUERIES = [
  "restaurants in Bentonville Arkansas",
  "restaurants in Rogers Arkansas",
  "restaurants in Fayetteville Arkansas",
  "restaurants in Springdale Arkansas",
  "restaurants in Bella Vista Arkansas",
  "restaurants in Centerton Arkansas",
  "restaurants in Lowell Arkansas",
  "restaurants in Cave Springs Arkansas",
  "restaurants in Siloam Springs Arkansas",
  "restaurants in Pea Ridge Arkansas",
  "cafes in Bentonville Arkansas",
  "cafes in Fayetteville Arkansas",
  "bars in Bentonville Arkansas",
  "bars in Fayetteville Arkansas",
];

const NWA_BIAS = {
  rectangle: {
    low: { latitude: 35.95, longitude: -94.45 },
    high: { latitude: 36.55, longitude: -93.95 },
  },
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.types",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.regularOpeningHours",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.photos",
  "nextPageToken",
].join(",");

const PRICE_MAP = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

const MIN_RATING = 4.0;
const MIN_REVIEWS = 50;

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickCity(p) {
  return p.addressComponents?.find((c) => c.types?.includes("locality"))?.longText ?? "";
}

function pickCuisine(p) {
  return (
    (p.types ?? [])
      .filter((t) => t.endsWith("_restaurant") && t !== "restaurant")
      .map((t) =>
        t
          .replace("_restaurant", "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      )[0] ?? null
  );
}

function photoUrl(name, w = 1200) {
  return name
    ? `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&key=${PLACES_KEY}`
    : null;
}

function photoUrls(p, max = 5) {
  return (p.photos ?? []).slice(0, max).map((ph) => photoUrl(ph.name)).filter(Boolean);
}

async function search(textQuery, pageToken) {
  const body = {
    textQuery,
    includedType: "restaurant",
    locationBias: NWA_BIAS,
    minRating: MIN_RATING,
    pageSize: 20,
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Places ${res.status}: ${t}`);
  }
  return res.json();
}

const allPlaces = new Map(); // place_id -> place
const usedSlugs = new Set();

for (const q of QUERIES) {
  process.stdout.write(`→ ${q} `);
  let pageToken;
  let pages = 0;
  do {
    const json = await search(q, pageToken);
    for (const p of json.places ?? []) {
      if (!p.id) continue;
      if ((p.userRatingCount ?? 0) < MIN_REVIEWS) continue;
      if (isBlocked({ name: p.displayName?.text, types: p.types })) continue;
      const city = pickCity(p);
      // Keep things truly in NWA — Google sometimes leaks nearby Missouri spots
      const NWA_CITIES = new Set([
        "Bentonville",
        "Rogers",
        "Fayetteville",
        "Springdale",
        "Bella Vista",
        "Centerton",
        "Lowell",
        "Cave Springs",
        "Siloam Springs",
        "Pea Ridge",
        "Tontitown",
        "Johnson",
        "Elm Springs",
        "Goshen",
        "Farmington",
        "Prairie Grove",
      ]);
      if (city && !NWA_CITIES.has(city)) continue;
      allPlaces.set(p.id, p);
    }
    pageToken = json.nextPageToken;
    pages++;
    process.stdout.write(".");
    if (pageToken) {
      // Google requires a brief delay before nextPageToken becomes valid
      await new Promise((r) => setTimeout(r, 1500));
    }
  } while (pageToken && pages < 3); // max 60 results per query
  process.stdout.write(`  (${allPlaces.size} unique total)\n`);
}

console.log(`\nDeduped: ${allPlaces.size} restaurants. Upserting to Supabase…`);

// Pre-load existing slugs so we don't collide with seeded rows (or earlier import runs)
const { data: existing } = await supabase
  .from("restaurants")
  .select("slug, google_place_id");
const slugToPlace = new Map();
for (const row of existing ?? []) {
  slugToPlace.set(row.slug, row.google_place_id);
  usedSlugs.add(row.slug);
}

const rows = [];
for (const p of allPlaces.values()) {
  const name = p.displayName?.text;
  if (!name) continue;
  const base = slugify(name);
  let slug = base;
  // If slug exists and belongs to a DIFFERENT (or seeded) row, append a suffix
  let n = 1;
  while (usedSlugs.has(slug) && slugToPlace.get(slug) !== p.id) {
    n++;
    slug = `${base}-${n}`;
  }
  usedSlugs.add(slug);

  const photos = photoUrls(p);
  rows.push({
    slug,
    name,
    description: null,
    city: pickCity(p) || "Bentonville",
    address: p.formattedAddress ?? null,
    cuisine: pickCuisine(p),
    cover_image_url: photos[0] ?? null,
    photo_urls: photos,
    google_place_id: p.id,
    website: p.websiteUri ?? null,
    phone: p.nationalPhoneNumber ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    rating: p.rating ?? null,
    user_rating_count: p.userRatingCount ?? null,
    price_level: PRICE_MAP[p.priceLevel] ?? null,
    hours_text: p.regularOpeningHours?.weekdayDescriptions ?? null,
    is_active: true,
  });
}

// Upsert in chunks of 100
let inserted = 0;
for (let i = 0; i < rows.length; i += 100) {
  const chunk = rows.slice(i, i + 100);
  const { error, count } = await supabase
    .from("restaurants")
    .upsert(chunk, { onConflict: "google_place_id", count: "exact" });
  if (error) {
    console.error("Upsert error:", error.message);
    break;
  }
  inserted += count ?? chunk.length;
  process.stdout.write(`  ${inserted}/${rows.length}\r`);
}

console.log(`\n✓ Done. Imported/updated ${inserted} restaurants.`);
