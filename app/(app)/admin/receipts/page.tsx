import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("receipts")
    .select("id, status, amount_cents, points_awarded, photo_url, created_at, profiles(username, display_name), restaurants(slug, name, city)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);

  const { data: rows } = await query;

  const withSigned = await Promise.all(
    (rows ?? []).map(async (r: any) => {
      const { data } = await supabase.storage.from("receipts").createSignedUrl(r.photo_url, 3600);
      return { ...r, signed: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="headline text-3xl">All receipts</h1>

      <div className="flex gap-1">
        <FilterLink href="/admin/receipts" label="All" active={!status} />
        <FilterLink href="/admin/receipts?status=pending" label="Pending" active={status === "pending"} />
        <FilterLink href="/admin/receipts?status=approved" label="Approved" active={status === "approved"} />
        <FilterLink href="/admin/receipts?status=rejected" label="Rejected" active={status === "rejected"} />
      </div>

      <ul className="flex flex-col gap-2">
        {withSigned.map((r: any) => (
          <li key={r.id} className="postcard p-3 flex items-center gap-3">
            {r.signed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.signed} alt="" className="size-16 object-cover rounded shrink-0 border border-[var(--pp-cream-dark)]" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-serif text-sm">
                <Link href={`/admin/restaurants/${r.restaurants?.slug}/edit`}>{r.restaurants?.name}</Link>
                {" · "}
                <Link href={`/admin/users/${r.profiles?.username}`} className="text-[var(--pp-burgundy)]">@{r.profiles?.username}</Link>
              </div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-0.5">
                {new Date(r.created_at).toLocaleString()}
                {r.amount_cents != null && ` · $${(r.amount_cents / 100).toFixed(2)}`}
                {r.points_awarded > 0 && ` · +${r.points_awarded} ★`}
              </div>
            </div>
            <span className={`postage shrink-0 ${r.status === "approved" ? "text-[var(--pp-forest)] border-[var(--pp-forest)]" : r.status === "rejected" ? "text-red-700 border-red-700" : ""}`}>
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.15em] uppercase ${
        active ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)]" : "text-[var(--pp-ink-soft)]"
      }`}
    >
      {label}
    </Link>
  );
}
