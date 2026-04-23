import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const { count: pendingClaims } = await supabase
    .from("restaurant_claims")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: totalRestaurants } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: pendingReceipts } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: userCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="eyebrow">Admin</div>
        <h1 className="headline text-3xl mt-2">Control room</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Pending claims" value={pendingClaims ?? 0} highlight={!!pendingClaims} />
        <Tile label="Pending receipts" value={pendingReceipts ?? 0} highlight={!!pendingReceipts} />
        <Tile label="Active restaurants" value={totalRestaurants ?? 0} />
        <Tile label="Travelers" value={userCount ?? 0} />
      </div>

      <section>
        <h2 className="section-heading">Tools</h2>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <AdminLink href="/admin/claims" title="Restaurant claims" desc="Review pending applications and approve owners." badge={pendingClaims ?? 0} />
          <AdminLink href="/admin/receipts?status=pending" title="Receipts" desc="Global receipt queue — spot fraud patterns." badge={pendingReceipts ?? 0} />
          <AdminLink href="/admin/restaurants" title="Restaurants" desc="Edit, feature, deactivate, manage ownership, refresh from Google." />
          <AdminLink href="/admin/users" title="Users" desc="Search travelers, grant admin, suspend, reset password." />
          <AdminLink href="/admin/posts" title="Posts (moderation)" desc="Latest 100 posts with quick-delete." />
          <AdminLink href="/admin/announcements" title="Broadcast" desc="Post a banner that appears on the feed." />
          <AdminLink href="/admin/stats" title="Stats" desc="Totals, 7-day activity, top restaurants and travelers." />
          <AdminLink href="/admin/restaurants/new" title="Add restaurant" desc="Pull from Google Places." />
        </div>
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

function AdminLink({ href, title, desc, badge }: { href: string; title: string; desc: string; badge?: number }) {
  return (
    <Link href={href} className="postcard p-4 flex items-center justify-between">
      <div>
        <div className="font-serif text-lg">{title}</div>
        <div className="font-serif italic text-sm text-[var(--pp-ink-soft)] mt-0.5">{desc}</div>
      </div>
      {badge && badge > 0 ? (
        <span className="postage">{badge}</span>
      ) : (
        <span className="font-mono text-[var(--pp-burgundy)]">→</span>
      )}
    </Link>
  );
}
