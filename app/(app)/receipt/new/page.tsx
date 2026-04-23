import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { submitReceiptAction } from "./actions";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r: slug } = await searchParams;
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
        <div className="eyebrow">Proof of Travel</div>
        <h1 className="headline text-3xl mt-2">Submit a receipt</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] mt-2 text-sm">
          A quick snapshot of your receipt is reviewed by the restaurant, and points land in your passport within a day.
        </p>
      </header>

      <form action={submitReceiptAction} className="flex flex-col gap-4">
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
          <label className="eyebrow">Receipt photo</label>
          <input
            type="file"
            name="receipt"
            accept="image/*"
            required
            className="block mt-2 text-sm font-mono file:mr-3 file:px-4 file:py-2 file:rounded-full file:border file:border-[var(--pp-burgundy)] file:bg-transparent file:text-[var(--pp-burgundy)] file:font-mono file:text-[10px] file:tracking-[0.2em] file:uppercase file:cursor-pointer"
          />
          <p className="font-mono text-[10px] text-[var(--pp-ink-soft)] mt-1.5">
            Make sure the total and restaurant name are visible.
          </p>
        </div>

        <div>
          <label className="eyebrow">Total (optional)</label>
          <div className="mt-2 flex items-center input p-0">
            <span className="px-3 font-mono text-[var(--pp-ink-soft)]">$</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="flex-1 py-3 pr-3 bg-transparent outline-none font-mono"
            />
          </div>
          <p className="font-mono text-[10px] text-[var(--pp-ink-soft)] mt-1.5">
            Helps the reviewer. Optional — you can leave blank.
          </p>
        </div>

        <button className="btn-primary py-4 mt-2 text-sm">Submit for review</button>
      </form>
    </div>
  );
}
