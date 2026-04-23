import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CITIES = [
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
];

type Sort = "name" | "rating" | "activity" | "city";

const SORTS: { value: Sort; label: string }[] = [
  { value: "activity", label: "Recent" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "A–Z" },
  { value: "city", label: "By town" },
];

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string; sort?: Sort }>;
}) {
  const { city, q, sort = "activity" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("restaurants")
    .select("slug, name, description, city, cuisine, cover_image_url, rating, user_rating_count, price_level, last_activity_at")
    .eq("is_active", true)
    .limit(300);

  if (city) query = query.eq("city", city);
  if (q) query = query.ilike("name", `%${q}%`);

  switch (sort) {
    case "rating":
      query = query.order("rating", { ascending: false, nullsFirst: false }).order("user_rating_count", { ascending: false, nullsFirst: false });
      break;
    case "activity":
      query = query.order("last_activity_at", { ascending: false, nullsFirst: false }).order("rating", { ascending: false, nullsFirst: false });
      break;
    case "city":
      query = query.order("city").order("name");
      break;
    case "name":
    default:
      query = query.order("name");
  }

  const { data: restaurants } = await query;

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <div className="eyebrow">A Field Guide</div>
        <h1 className="headline text-4xl mt-2">The Atlas</h1>
        <div className="fleuron mt-4">⌑</div>
        <p className="font-serif italic text-[var(--pp-ink-soft)] mt-2 text-sm">
          {restaurants?.length ?? 0} destinations across Northwest Arkansas
        </p>
      </header>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search destinations…"
          className="input flex-1"
        />
        {city && <input type="hidden" name="city" value={city} />}
        {sort && <input type="hidden" name="sort" value={sort} />}
        <button className="btn-primary">Go</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
        <CityChip href={buildHref({ q, sort })} label="All towns" active={!city} />
        {CITIES.map((c) => (
          <CityChip key={c} href={buildHref({ q, city: c, sort })} label={c} active={city === c} />
        ))}
      </div>

      <div className="flex items-center justify-end gap-1 -mt-2">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={buildHref({ q, city, sort: s.value })}
            className={`px-2.5 py-1 rounded font-mono text-[10px] tracking-[0.15em] uppercase ${
              sort === s.value
                ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)]"
                : "text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {restaurants?.map((r) => (
          <li key={r.slug}>
            <Link href={`/r/${r.slug}`} className="postcard flex gap-0">
              <div className="size-24 shrink-0 overflow-hidden border-r border-[var(--pp-cream-dark)] bg-[var(--pp-cream)]">
                {r.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover_image_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-[var(--pp-burgundy)]/30 font-serif text-2xl">
                    ⌑
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-serif text-[var(--pp-ink)] leading-tight">{r.name}</div>
                  {r.rating != null && (
                    <span className="postage shrink-0">
                      <span className="star">★</span> {Number(r.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-2 flex flex-wrap gap-x-2">
                  <span>{r.city}</span>
                  {r.cuisine && <span>· {r.cuisine}</span>}
                  {r.price_level && <span>· {r.price_level}</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CityChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] tracking-[0.15em] uppercase border ${
        active
          ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)] border-[var(--pp-burgundy)]"
          : "border-[var(--pp-cream-dark)] text-[var(--pp-ink-soft)] hover:border-[var(--pp-burgundy)] hover:text-[var(--pp-burgundy)]"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref({ q, city, sort }: { q?: string; city?: string; sort?: Sort }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (sort && sort !== "activity") params.set("sort", sort);
  const s = params.toString();
  return s ? `/restaurants?${s}` : "/restaurants";
}
