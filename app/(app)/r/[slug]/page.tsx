import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!restaurant) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { count: visitCount } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  const { data: myVisits } = user
    ? await supabase
        .from("checkins")
        .select("id, created_at")
        .eq("restaurant_id", restaurant.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; created_at: string }[] };

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, caption, photo_url, created_at, profiles(username)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const photos: string[] = restaurant.photo_urls ?? [];
  const mapHref = restaurant.lat && restaurant.lng
    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}&query_place_id=${restaurant.google_place_id ?? ""}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/restaurants" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
        ← Atlas
      </Link>

      {/* Hero photo */}
      {photos[0] && (
        <div className="relative -mx-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt="" className="w-full aspect-[3/2] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--pp-paper)] via-transparent to-transparent" />
          {/* Postage-style stamp top-right */}
          {restaurant.rating != null && (
            <div className="absolute top-4 right-4 stamp" style={{ transform: "rotate(8deg)" }}>
              <span className="stamp-name">{restaurant.city}</span>
              <span className="stamp-date">★ {Number(restaurant.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Title block */}
      <header>
        <div className="eyebrow">{restaurant.city} · {restaurant.cuisine ?? "Restaurant"}</div>
        <h1 className="headline text-4xl mt-2">{restaurant.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {restaurant.rating != null && (
            <span className="postage">
              <span className="star">★</span> {Number(restaurant.rating).toFixed(1)}
              {restaurant.user_rating_count != null && ` · ${restaurant.user_rating_count} reviews`}
            </span>
          )}
          {restaurant.price_level && (
            <span className="postage">{restaurant.price_level}</span>
          )}
        </div>
        {restaurant.description && (
          <p className="mt-4 font-serif italic text-[var(--pp-ink-soft)] leading-relaxed">
            "{restaurant.description}"
          </p>
        )}
      </header>

      {/* Stats line */}
      <div className="flex items-center justify-between border-y border-[var(--pp-cream-dark)] py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
        <span><span className="text-[var(--pp-burgundy)] font-bold">{visitCount ?? 0}</span> stamps logged</span>
        <span><span className="text-[var(--pp-burgundy)] font-bold">{myVisits?.length ?? 0}</span> yours</span>
      </div>

      {/* Actions */}
      <div className="postcard p-5 text-center">
        <div className="eyebrow">To Stamp Your Passport</div>
        <p className="mt-2 font-serif italic text-[var(--pp-ink-soft)]">
          Visit in person and scan the Passport NWA QR code at the table.
        </p>
      </div>
      <Link href={`/post/new?r=${restaurant.slug}`} className="btn-ghost w-full">
        Leave a field note
      </Link>

      {/* Practical info — postcards */}
      <section className="grid grid-cols-2 gap-2">
        {restaurant.phone && (
          <a href={`tel:${restaurant.phone}`} className="postcard p-3">
            <div className="eyebrow">Telephone</div>
            <div className="font-mono text-sm mt-1 truncate">{restaurant.phone}</div>
          </a>
        )}
        {restaurant.website && (
          <a href={restaurant.website} target="_blank" rel="noreferrer" className="postcard p-3">
            <div className="eyebrow">Online</div>
            <div className="font-mono text-sm mt-1 text-[var(--pp-burgundy)] truncate">Visit →</div>
          </a>
        )}
        {mapHref && (
          <a href={mapHref} target="_blank" rel="noreferrer" className="postcard p-3 col-span-2">
            <div className="eyebrow">Location</div>
            <div className="font-serif text-sm mt-1">{restaurant.address}</div>
          </a>
        )}
      </section>

      {/* Hours */}
      {restaurant.hours_text && restaurant.hours_text.length > 0 && (
        <section>
          <h2 className="section-heading">Hours of Reception</h2>
          <ul className="postcard mt-3 divide-y divide-[var(--pp-cream-dark)]">
            {restaurant.hours_text.map((line: string, i: number) => {
              const [day, ...rest] = line.split(": ");
              return (
                <li key={i} className="flex justify-between px-4 py-2.5 font-mono text-xs">
                  <span className="text-[var(--pp-ink-soft)]">{day}</span>
                  <span className="text-[var(--pp-ink)]">{rest.join(": ") || "—"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Photo gallery */}
      {photos.length > 1 && (
        <section>
          <h2 className="section-heading">Sights</h2>
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mt-3 scrollbar-none">
            {photos.slice(1).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-44 w-64 shrink-0 rounded-md object-cover border border-[var(--pp-cream-dark)]"
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent field notes from this destination */}
      {recentPosts && recentPosts.length > 0 && (
        <section>
          <h2 className="section-heading">Recent Field Notes</h2>
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {recentPosts.map((p: any) => (
              <Link
                key={p.id}
                href={`/u/${p.profiles?.username}`}
                className="aspect-square overflow-hidden border border-[var(--pp-cream-dark)] bg-[var(--pp-cream)]"
              >
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full p-2 flex items-center justify-center font-serif italic text-[10px] text-[var(--pp-ink-soft)] text-center">
                    {p.caption?.slice(0, 50) ?? "—"}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
