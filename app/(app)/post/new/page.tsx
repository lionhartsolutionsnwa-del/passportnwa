import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPostAction } from "./actions";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; checkedIn?: string }>;
}) {
  const { r: slug, checkedIn } = await searchParams;
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, slug, name, city")
    .eq("is_active", true)
    .order("name");

  const initial = slug ? restaurants?.find((x) => x.slug === slug) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
        ← Journal
      </Link>
      <header>
        <div className="eyebrow">A New Entry</div>
        <h1 className="headline text-3xl mt-2">Field Note</h1>
        {checkedIn && (
          <p className="mt-3 font-serif italic text-[var(--pp-forest)]">
            ✓ Stamped. Now leave a note for fellow travelers.
          </p>
        )}
      </header>

      <form action={createPostAction} className="flex flex-col gap-4">
        <div>
          <label className="eyebrow">Destination</label>
          <select name="restaurant_id" defaultValue={initial?.id ?? ""} required className="input mt-2">
            <option value="">Choose a destination</option>
            {restaurants?.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="eyebrow">The note</label>
          <textarea
            name="caption"
            rows={5}
            placeholder="What did you have? Worth the trip? Tag friends with @username."
            className="input mt-2 font-serif text-base resize-none"
          />
        </div>

        <div>
          <label className="eyebrow">A photograph</label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="block mt-2 text-sm font-mono file:mr-3 file:px-4 file:py-2 file:rounded-full file:border file:border-[var(--pp-burgundy)] file:bg-transparent file:text-[var(--pp-burgundy)] file:font-mono file:text-[10px] file:tracking-[0.2em] file:uppercase file:cursor-pointer"
          />
        </div>

        <button className="btn-primary py-4 mt-2 text-sm">Publish entry</button>
      </form>
    </div>
  );
}
