import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const DAY_MS = 86_400_000;

export default async function AdminStatsPage() {
  const supabase = await createClient();

  const sinceWeek  = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const sinceMonth = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [
    { count: totalUsers },
    { count: totalRestaurants },
    { count: totalStamps },
    { count: totalPosts },
    { count: signupsWeek },
    { count: signupsMonth },
    { count: stampsWeek },
    { count: postsWeek },
    { count: pendingClaims },
    { count: pendingReceipts },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("checkins").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sinceWeek),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sinceMonth),
    supabase.from("checkins").select("id", { count: "exact", head: true }).gte("created_at", sinceWeek),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", sinceWeek),
    supabase.from("restaurant_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("receipts").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Top restaurants by stamps
  const { data: topByStamps } = await supabase
    .from("checkins")
    .select("restaurant_id, restaurants(slug, name, city)")
    .limit(2000);
  const stampCounts = new Map<string, { name: string; city: string; slug: string; count: number }>();
  for (const c of (topByStamps ?? []) as any[]) {
    const key = c.restaurant_id;
    const r = c.restaurants;
    if (!r) continue;
    const existing = stampCounts.get(key);
    if (existing) existing.count++;
    else stampCounts.set(key, { slug: r.slug, name: r.name, city: r.city, count: 1 });
  }
  const topStamps = [...stampCounts.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  // Top users by points
  const { data: topUsers } = await supabase
    .from("profiles")
    .select("username, display_name, points")
    .order("points", { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="headline text-3xl">Stats</h1>

      <section>
        <h2 className="section-heading">Totals</h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Tile label="Travelers" value={totalUsers ?? 0} />
          <Tile label="Restaurants" value={totalRestaurants ?? 0} />
          <Tile label="Stamps all-time" value={totalStamps ?? 0} />
          <Tile label="Posts all-time" value={totalPosts ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="section-heading">Last 7 days</h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Tile label="New signups" value={signupsWeek ?? 0} />
          <Tile label="Stamps" value={stampsWeek ?? 0} />
          <Tile label="Posts" value={postsWeek ?? 0} />
          <Tile label="Signups this month" value={signupsMonth ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="section-heading">Needs attention</h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Tile label="Pending claims"  value={pendingClaims ?? 0}  highlight={!!pendingClaims} />
          <Tile label="Pending receipts" value={pendingReceipts ?? 0} highlight={!!pendingReceipts} />
        </div>
      </section>

      <section>
        <h2 className="section-heading">Top restaurants (by stamps)</h2>
        <ul className="mt-3 flex flex-col gap-1">
          {topStamps.map((r, i) => (
            <li key={r.slug} className="flex items-center justify-between border border-[var(--pp-cream-dark)] rounded px-3 py-2 text-sm">
              <Link href={`/admin/restaurants/${r.slug}/edit`}>
                <span className="font-mono text-[var(--pp-ink-soft)] mr-2">№{i + 1}</span>
                <span className="font-serif">{r.name}</span>
                <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2 uppercase tracking-widest">{r.city}</span>
              </Link>
              <span className="postage">★ {r.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="section-heading">Top travelers (by points)</h2>
        <ul className="mt-3 flex flex-col gap-1">
          {topUsers?.map((u, i) => (
            <li key={u.username} className="flex items-center justify-between border border-[var(--pp-cream-dark)] rounded px-3 py-2 text-sm">
              <Link href={`/admin/users/${u.username}`}>
                <span className="font-mono text-[var(--pp-ink-soft)] mr-2">№{i + 1}</span>
                <span className="font-serif">{u.display_name ?? u.username}</span>
                <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2">@{u.username}</span>
              </Link>
              <span className="postage">★ {u.points}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`postcard p-4 ${highlight ? "border-[var(--pp-burgundy)] border-2" : ""}`}>
      <div className="font-serif text-3xl text-[var(--pp-burgundy)]">{value}</div>
      <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[var(--pp-ink-soft)] mt-1">{label}</div>
    </div>
  );
}
