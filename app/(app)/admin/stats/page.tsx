import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Sparkline from "@/components/sparkline";

const DAY_MS = 86_400_000;

function bucketByDay(rows: { created_at: string }[], days: number) {
  const buckets = new Array(days).fill(0);
  const start = Date.now() - (days - 1) * DAY_MS;
  const startOfDay = new Date(start);
  startOfDay.setHours(0, 0, 0, 0);
  const startMs = startOfDay.getTime();
  for (const r of rows) {
    const ms = new Date(r.created_at).getTime();
    const idx = Math.floor((ms - startMs) / DAY_MS);
    if (idx >= 0 && idx < days) buckets[idx]++;
  }
  return buckets;
}

export default async function AdminStatsPage() {
  const supabase = await createClient();

  const sinceWeek = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const sinceMonth = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const sincePrevWeek = new Date(Date.now() - 14 * DAY_MS).toISOString();
  const sincePrevMonth = new Date(Date.now() - 60 * DAY_MS).toISOString();

  const [
    { count: totalUsers },
    { count: totalRestaurants },
    { count: totalStamps },
    { count: totalPosts },
    { count: pendingClaims },
    { count: pendingReceipts },
    signupsRows,
    signupsPrev,
    stampsRows,
    stampsPrev,
    postsRows,
    receiptsApproved,
    receiptsApprovedPrev,
    everStamped,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("checkins").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("restaurant_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("receipts").select("id", { count: "exact", head: true }).eq("status", "pending"),

    supabase.from("profiles").select("created_at").gte("created_at", sinceMonth).order("created_at"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sincePrevMonth).lt("created_at", sinceMonth),
    supabase.from("checkins").select("created_at").gte("created_at", sinceMonth).order("created_at"),
    supabase.from("checkins").select("id", { count: "exact", head: true }).gte("created_at", sincePrevWeek).lt("created_at", sinceWeek),
    supabase.from("posts").select("created_at").gte("created_at", sinceMonth).order("created_at"),
    supabase.from("receipts").select("id", { count: "exact", head: true }).eq("status", "approved").gte("created_at", sinceMonth),
    supabase.from("receipts").select("id", { count: "exact", head: true }).eq("status", "approved").gte("created_at", sincePrevMonth).lt("created_at", sinceMonth),
    supabase.from("checkins").select("user_id"),
  ]);

  const signupsDays = bucketByDay(signupsRows.data ?? [], 30);
  const stampsDays = bucketByDay(stampsRows.data ?? [], 30);
  const postsDays = bucketByDay(postsRows.data ?? [], 30);

  const signups7 = signupsDays.slice(-7).reduce((a, b) => a + b, 0);
  const signups30 = signupsDays.reduce((a, b) => a + b, 0);
  const stamps7 = stampsDays.slice(-7).reduce((a, b) => a + b, 0);
  const stampsPrev7 = stampsPrev.count ?? 0;
  const stamps30 = stampsDays.reduce((a, b) => a + b, 0);
  const posts7 = postsDays.slice(-7).reduce((a, b) => a + b, 0);
  const posts30 = postsDays.reduce((a, b) => a + b, 0);

  const stampsTrend = pctChange(stamps7, stampsPrev7);
  const signupsTrend = pctChange(signups30, signupsPrev.count ?? 0);
  const receiptsTrend = pctChange(receiptsApproved.count ?? 0, receiptsApprovedPrev.count ?? 0);

  // Engagement funnel
  const stampedUserIds = new Set((everStamped.data ?? []).map((c: any) => c.user_id));
  const totalUserCount = totalUsers ?? 0;
  const stampedRate = totalUserCount > 0 ? Math.round((stampedUserIds.size / totalUserCount) * 100) : 0;

  const { count: ratedCount } = await supabase
    .from("restaurant_ratings")
    .select("user_id", { count: "exact", head: true });
  const { count: postedCount } = await supabase
    .from("posts")
    .select("user_id", { count: "exact", head: true });
  const { count: receiptCount } = await supabase
    .from("receipts")
    .select("user_id", { count: "exact", head: true });

  // Top restaurants by stamps last 30 days
  const { data: topByStamps } = await supabase
    .from("checkins")
    .select("restaurant_id, restaurants(slug, name, city)")
    .gte("created_at", sinceMonth)
    .limit(2000);
  const stampCounts = new Map<string, { name: string; city: string; slug: string; count: number }>();
  for (const c of (topByStamps ?? []) as any[]) {
    const key = c.restaurant_id;
    const r = c.restaurants;
    if (!r) continue;
    const ex = stampCounts.get(key);
    if (ex) ex.count++;
    else stampCounts.set(key, { slug: r.slug, name: r.name, city: r.city, count: 1 });
  }
  const topStamps = [...stampCounts.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  const { data: topUsers } = await supabase
    .from("profiles")
    .select("username, display_name, points")
    .order("points", { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="headline text-3xl">Stats</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-1">
          Last 30 days. Real-time data from Supabase.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <BigStat label="Travelers" value={totalUsers ?? 0} delta={signupsTrend} />
        <BigStat label="Restaurants" value={totalRestaurants ?? 0} />
        <BigStat label="Stamps all-time" value={totalStamps ?? 0} />
        <BigStat label="Posts all-time" value={totalPosts ?? 0} />
      </section>

      {/* CHARTS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ChartCard
          title="Signups"
          number={signups30}
          subtitle={`${signups7} this week`}
          data={signupsDays}
          trend={signupsTrend}
        />
        <ChartCard
          title="Stamps"
          number={stamps30}
          subtitle={`${stamps7} this week`}
          data={stampsDays}
          trend={stampsTrend}
        />
        <ChartCard
          title="Field notes"
          number={posts30}
          subtitle={`${posts7} this week`}
          data={postsDays}
        />
      </section>

      {/* QUEUE */}
      <section className="grid grid-cols-2 gap-3">
        <Tile label="Pending claims"  value={pendingClaims ?? 0} highlight={!!pendingClaims} href="/admin/claims" />
        <Tile label="Pending receipts" value={pendingReceipts ?? 0} highlight={!!pendingReceipts} href="/admin/receipts?status=pending" />
        <Tile label="Approved receipts (30d)" value={receiptsApproved.count ?? 0} delta={receiptsTrend} />
        <Tile label="Active restaurants" value={totalRestaurants ?? 0} href="/admin/restaurants?filter=featured" />
      </section>

      {/* ENGAGEMENT FUNNEL */}
      <section>
        <h2 className="section-heading">Engagement funnel</h2>
        <div className="postcard mt-3 p-4 flex flex-col gap-3">
          <FunnelRow label="Signed up" value={totalUserCount} percent={100} />
          <FunnelRow label="Stamped a passport" value={stampedUserIds.size} percent={stampedRate} />
          <FunnelRow label="Rated a restaurant" value={ratedCount ?? 0} percent={pct(ratedCount ?? 0, totalUserCount)} />
          <FunnelRow label="Posted a field note" value={postedCount ?? 0} percent={pct(postedCount ?? 0, totalUserCount)} />
          <FunnelRow label="Submitted a receipt" value={receiptCount ?? 0} percent={pct(receiptCount ?? 0, totalUserCount)} />
        </div>
      </section>

      {/* TOP RESTAURANTS */}
      <section>
        <h2 className="section-heading">Top restaurants — last 30 days</h2>
        <ul className="mt-3 flex flex-col gap-1">
          {topStamps.length === 0 && (
            <li className="font-serif italic text-[var(--pp-ink-soft)] text-sm">No stamps yet.</li>
          )}
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

      {/* TOP TRAVELERS */}
      <section>
        <h2 className="section-heading">Top travelers — by points</h2>
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

      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] text-center mt-4">
        Visitor traffic + Core Web Vitals on the{" "}
        <a
          href="https://vercel.com/morrisondemers-1462s-projects/passportnwa/analytics"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--pp-burgundy)] underline"
        >
          Vercel dashboard
        </a>
      </p>
    </div>
  );
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function pctChange(curr: number, prev: number) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function BigStat({ label, value, delta }: { label: string; value: number; delta?: number }) {
  return (
    <div className="postcard p-4">
      <div className="font-serif text-3xl text-[var(--pp-burgundy)] leading-none">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--pp-ink-soft)]">{label}</div>
        {typeof delta === "number" && (
          <span
            className={`font-mono text-[10px] ${
              delta > 0 ? "text-[var(--pp-forest)]" : delta < 0 ? "text-red-700" : "text-[var(--pp-ink-soft)]"
            }`}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "·"} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  number,
  subtitle,
  data,
  trend,
}: {
  title: string;
  number: number;
  subtitle: string;
  data: number[];
  trend?: number;
}) {
  return (
    <div className="postcard p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--pp-ink-soft)]">{title}</div>
          <div className="font-serif text-3xl text-[var(--pp-burgundy)] leading-none mt-2">{number}</div>
          <div className="font-mono text-[11px] text-[var(--pp-ink-soft)] mt-1">{subtitle}</div>
        </div>
        {typeof trend === "number" && (
          <span
            className={`font-mono text-xs ${
              trend > 0 ? "text-[var(--pp-forest)]" : trend < 0 ? "text-red-700" : "text-[var(--pp-ink-soft)]"
            }`}
          >
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "·"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <Sparkline data={data} height={56} />
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  highlight,
  delta,
  href,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  delta?: number;
  href?: string;
}) {
  const inner = (
    <div className={`postcard p-4 h-full ${highlight ? "border-[var(--pp-burgundy)] border-2" : ""}`}>
      <div className="font-serif text-2xl text-[var(--pp-burgundy)] leading-none">{value}</div>
      <div className="flex items-center gap-2 mt-1.5">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--pp-ink-soft)]">{label}</div>
        {typeof delta === "number" && (
          <span
            className={`font-mono text-[10px] ${
              delta > 0 ? "text-[var(--pp-forest)]" : delta < 0 ? "text-red-700" : "text-[var(--pp-ink-soft)]"
            }`}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "·"}{Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function FunnelRow({ label, value, percent }: { label: string; value: number; percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0 font-serif text-sm">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-[var(--pp-cream-dark)] overflow-hidden">
        <div
          className="h-full bg-[var(--pp-burgundy)]"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
      </div>
      <div className="w-24 text-right font-mono text-xs text-[var(--pp-ink)] tabular-nums">
        {value} · {percent}%
      </div>
    </div>
  );
}
