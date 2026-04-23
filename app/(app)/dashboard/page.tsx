import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { qrDataUrl, stampUrl } from "@/lib/qr";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("restaurant_owners")
    .select("restaurant_id, restaurants(id, slug, name, city, check_in_token, cover_image_url)")
    .eq("user_id", user.id);

  if (!owned || owned.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <div className="eyebrow">Concierge</div>
          <h1 className="headline text-3xl mt-2">Restaurant dashboard</h1>
        </header>
        <div className="postcard p-6 text-center">
          <p className="font-serif italic text-[var(--pp-ink-soft)]">
            You don't manage any destinations yet.
          </p>
          <Link href="/claim" className="btn-primary mt-4">
            Claim your restaurant →
          </Link>
        </div>
      </div>
    );
  }

  const restaurantIds = owned.map((o: any) => o.restaurant_id);

  const { count: totalCheckins } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .in("restaurant_id", restaurantIds);

  const { count: postCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .in("restaurant_id", restaurantIds);

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, caption, photo_url, created_at, profiles(username), restaurants(slug, name)")
    .in("restaurant_id", restaurantIds)
    .order("created_at", { ascending: false })
    .limit(10);

  // Top customers
  const { data: allCheckins } = await supabase
    .from("checkins")
    .select("user_id, profiles(username, display_name)")
    .in("restaurant_id", restaurantIds);

  const counts = new Map<string, { username: string; display: string; count: number }>();
  for (const ci of (allCheckins ?? []) as any[]) {
    const k = ci.user_id;
    const existing = counts.get(k);
    if (existing) existing.count++;
    else counts.set(k, {
      username: ci.profiles?.username ?? "—",
      display: ci.profiles?.display_name ?? ci.profiles?.username ?? "—",
      count: 1,
    });
  }
  const topCustomers = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  // Determine origin for building QR codes
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // Precompute QR codes
  const qrByRestaurant: Record<string, { url: string; png: string }> = {};
  for (const o of owned as any[]) {
    const r = o.restaurants;
    if (!r) continue;
    const u = stampUrl(origin, r.slug, r.check_in_token);
    qrByRestaurant[r.id] = { url: u, png: await qrDataUrl(u) };
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="eyebrow">Concierge</div>
        <h1 className="headline text-3xl mt-2">Restaurant dashboard</h1>
        <p className="mt-2 font-serif italic text-[var(--pp-ink-soft)]">
          Managing {owned.map((o: any) => o.restaurants?.name).join(" · ")}
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Seal label="Stamps" value={totalCheckins ?? 0} />
        <Seal label="Field notes" value={postCount ?? 0} />
        <Seal label="Destinations" value={owned.length} />
      </div>

      {/* QR codes */}
      <section>
        <h2 className="section-heading">Your Stamping Stations</h2>
        <p className="mt-2 text-sm text-[var(--pp-ink-soft)] font-serif italic">
          Print this QR code and place it on your tables or at the register. Only travelers who scan it can stamp their passports.
        </p>
        <div className="flex flex-col gap-4 mt-4">
          {(owned as any[]).map((o) => {
            const r = o.restaurants;
            if (!r) return null;
            const qr = qrByRestaurant[r.id];
            return (
              <div key={r.id} className="postcard p-5 flex flex-col items-center">
                <div className="eyebrow">Station for</div>
                <div className="font-serif text-xl mt-1">{r.name}</div>
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--pp-ink-soft)] mt-0.5">
                  {r.city}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr.png}
                  alt={`QR code for ${r.name}`}
                  className="mt-4 w-56 h-56 rounded-md border border-[var(--pp-cream-dark)]"
                />
                <div className="fleuron w-full max-w-xs mt-4">⌑</div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] mt-2 break-all text-center">
                  {qr.url}
                </p>
                <div className="flex gap-2 mt-4">
                  <a href={qr.png} download={`passport-nwa-${r.slug}.png`} className="btn-ghost">
                    Download PNG
                  </a>
                  <Link href={`/dashboard/print/${r.slug}`} className="btn-ghost">
                    Printable sheet
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top customers */}
      <section>
        <h2 className="section-heading">Most Loyal Travelers</h2>
        {topCustomers.length === 0 ? (
          <p className="font-serif italic text-[var(--pp-ink-soft)] mt-3 text-sm">No stamps yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {topCustomers.map((c) => (
              <li key={c.username} className="postcard flex items-center justify-between px-4 py-2.5">
                <Link href={`/u/${c.username}`} className="hover:text-[var(--pp-burgundy)]">
                  <span className="font-serif text-[var(--pp-ink)]">{c.display}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] tracking-wider">@{c.username}</span>
                </Link>
                <span className="postage">
                  <span className="star">★</span> {c.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent posts */}
      <section>
        <h2 className="section-heading">Recent Field Notes</h2>
        {!recentPosts?.length ? (
          <p className="font-serif italic text-[var(--pp-ink-soft)] mt-3 text-sm">None yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recentPosts.map((p: any) => (
              <li key={p.id} className="postcard p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <Link href={`/u/${p.profiles?.username}`} className="font-serif text-[var(--pp-ink)] hover:text-[var(--pp-burgundy)]">
                      @{p.profiles?.username}
                    </Link>
                    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-0.5">
                      at {p.restaurants?.name} · {new Date(p.created_at).toLocaleDateString()}
                    </div>
                    {p.caption && <p className="font-serif mt-2 text-[var(--pp-ink)]">{p.caption}</p>}
                  </div>
                  {p.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo_url} alt="" className="size-16 object-cover rounded shrink-0 border border-[var(--pp-cream-dark)]" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Seal({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-3 px-2 border border-[var(--pp-burgundy)]/25 rounded-lg bg-white/50 shadow-inner">
      <div className="font-serif text-2xl text-[var(--pp-burgundy)] font-semibold">{value}</div>
      <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[var(--pp-burgundy)]/70 mt-0.5">
        {label}
      </div>
    </div>
  );
}
