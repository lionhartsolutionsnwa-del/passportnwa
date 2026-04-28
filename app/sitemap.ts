import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE = "https://www.passportnwa.com";

export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  const { data: restaurants } = await admin
    .from("restaurants")
    .select("slug, last_activity_at, created_at")
    .eq("is_active", true)
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .limit(2000);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: now, changeFrequency: "daily",  priority: 1.0 },
    { url: `${BASE}/restaurants`,         lastModified: now, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/login`,               lastModified: now, changeFrequency: "monthly",priority: 0.5 },
    { url: `${BASE}/restaurant-signup`,   lastModified: now, changeFrequency: "monthly",priority: 0.7 },
    { url: `${BASE}/privacy`,             lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`,               lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const restaurantPages: MetadataRoute.Sitemap = (restaurants ?? []).map((r) => ({
    url: `${BASE}/r/${r.slug}`,
    lastModified: r.last_activity_at ? new Date(r.last_activity_at) : new Date(r.created_at ?? now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...restaurantPages];
}
