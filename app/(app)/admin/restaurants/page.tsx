import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRestaurantsList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("restaurants")
    .select("id, slug, name, city, cuisine, rating, is_active, is_featured, cover_image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) query = query.ilike("name", `%${q}%`);
  if (filter === "inactive") query = query.eq("is_active", false);
  if (filter === "featured") query = query.eq("is_featured", true);

  const { data: restaurants } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="headline text-3xl">All restaurants</h1>
        <Link href="/admin/restaurants/new" className="btn-primary py-2 px-3 text-[11px]">Add new</Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name…" className="input flex-1" />
        {filter && <input type="hidden" name="filter" value={filter} />}
        <button className="btn-primary py-2 px-4 text-[11px]">Go</button>
      </form>

      <div className="flex gap-1">
        <FilterLink href="/admin/restaurants" label="All" active={!filter} />
        <FilterLink href="/admin/restaurants?filter=inactive" label="Inactive" active={filter === "inactive"} />
        <FilterLink href="/admin/restaurants?filter=featured" label="Featured" active={filter === "featured"} />
      </div>

      <ul className="flex flex-col gap-2">
        {restaurants?.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/restaurants/${r.slug}/edit`} className="postcard flex gap-0">
              <div className="size-16 shrink-0 overflow-hidden border-r border-[var(--pp-cream-dark)] bg-[var(--pp-cream)]">
                {r.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover_image_url} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 py-2 px-3">
                <div className="flex items-center gap-2">
                  <div className="font-serif truncate">{r.name}</div>
                  {r.is_featured && <span className="postage">★ featured</span>}
                  {!r.is_active && <span className="postage">hidden</span>}
                </div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-0.5">
                  {r.city}
                  {r.cuisine && ` · ${r.cuisine}`}
                  {r.rating != null && ` · ★ ${Number(r.rating).toFixed(1)}`}
                </div>
              </div>
            </Link>
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
