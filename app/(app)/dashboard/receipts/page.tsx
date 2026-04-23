import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { decideReceiptAction } from "./actions";

export default async function ReceiptsQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("restaurant_owners")
    .select("restaurant_id")
    .eq("user_id", user.id);

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = !!me?.is_admin;
  const restaurantIds = (owned ?? []).map((o) => o.restaurant_id);
  if (!isAdmin && restaurantIds.length === 0) redirect("/dashboard");

  let query = supabase
    .from("receipts")
    .select("id, status, amount_cents, photo_url, points_awarded, created_at, review_note, user_id, restaurants(slug, name, city), profiles(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!isAdmin) query = query.in("restaurant_id", restaurantIds);

  const { data: receipts } = await query;

  // Sign private photo URLs
  const withSigned = await Promise.all(
    (receipts ?? []).map(async (r: any) => {
      const { data } = await supabase.storage.from("receipts").createSignedUrl(r.photo_url, 3600);
      return { ...r, signed: data?.signedUrl ?? null };
    }),
  );

  const pending  = withSigned.filter((r) => r.status === "pending");
  const decided  = withSigned.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
          ← Concierge
        </Link>
        <h1 className="headline text-3xl mt-2">Receipts to review</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] mt-1 text-sm">
          {pending.length} pending · {decided.length} reviewed
        </p>
      </header>

      {pending.length === 0 && (
        <div className="postcard p-6 text-center">
          <p className="font-serif italic text-[var(--pp-ink-soft)]">No receipts waiting.</p>
        </div>
      )}

      {pending.map((r) => (
        <article key={r.id} className="postcard p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-serif text-lg">{r.restaurants?.name}</div>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
                {r.restaurants?.city} · {new Date(r.created_at).toLocaleString()}
              </div>
              <div className="text-sm mt-2">
                <Link href={`/u/${r.profiles?.username}`} className="font-serif text-[var(--pp-burgundy)]">
                  @{r.profiles?.username}
                </Link>
                {r.amount_cents != null && (
                  <span className="font-mono text-xs text-[var(--pp-ink-soft)] ml-2">
                    stated total ${(r.amount_cents / 100).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {r.signed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.signed} alt="Receipt" className="w-full max-h-96 object-contain rounded border border-[var(--pp-cream-dark)] bg-white" />
          )}

          <form action={decideReceiptAction} className="flex gap-2 items-center flex-wrap">
            <input type="hidden" name="id" value={r.id} />
            <label className="eyebrow">Award</label>
            <div className="flex items-center input p-0 w-24">
              <input
                name="points"
                type="number"
                min="0"
                max="500"
                defaultValue={10}
                className="flex-1 py-2.5 px-3 bg-transparent outline-none font-mono text-sm"
              />
              <span className="pr-3 font-mono text-[10px] text-[var(--pp-ink-soft)]">PTS</span>
            </div>
            <button name="decision" value="approved" className="btn-primary py-2 px-4 text-[11px]">
              Approve
            </button>
            <button name="decision" value="rejected" className="btn-ghost py-2 px-4 text-[11px]">
              Reject
            </button>
          </form>
        </article>
      ))}

      {decided.length > 0 && (
        <section>
          <h2 className="section-heading">Reviewed</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {decided.map((r) => (
              <li key={r.id} className="border border-[var(--pp-cream-dark)] rounded px-3 py-2 flex items-center justify-between text-sm">
                <span>
                  <span className="font-serif">{r.restaurants?.name}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--pp-ink-soft)]">@{r.profiles?.username}</span>
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.2em] uppercase ${
                    r.status === "approved" ? "text-[var(--pp-forest)]" : "text-red-700"
                  }`}
                >
                  {r.status}
                  {r.status === "approved" && r.points_awarded ? ` · +${r.points_awarded}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
