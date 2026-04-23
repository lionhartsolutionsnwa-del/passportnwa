import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fulfillByCodeAction, setStatusAction } from "./actions";

export default async function RedemptionsQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("restaurant_owners")
    .select("restaurant_id")
    .eq("user_id", user.id);
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const isAdmin = !!me?.is_admin;
  const restaurantIds = (owned ?? []).map((o) => o.restaurant_id);
  if (!isAdmin && restaurantIds.length === 0) redirect("/dashboard");

  let query = supabase
    .from("redemptions")
    .select("id, code, reward_name, points_spent, status, created_at, profiles(username, display_name), restaurants(slug, name, city)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!isAdmin) query = query.in("restaurant_id", restaurantIds);
  const { data: redemptions } = await query;

  const pending = (redemptions ?? []).filter((r) => r.status === "pending");
  const recent  = (redemptions ?? []).filter((r) => r.status !== "pending").slice(0, 20);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
          ← Concierge
        </Link>
        <h1 className="headline text-3xl mt-2">Redemptions</h1>
      </header>

      <section className="postcard p-4">
        <div className="eyebrow">Fulfill by code</div>
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-1">
          Traveler at the counter? Type their 6-character code.
        </p>
        <form action={fulfillByCodeAction} className="flex gap-2 mt-3">
          <input
            name="code"
            required
            pattern="[A-Za-z0-9]{6}"
            placeholder="ABC123"
            className="input font-mono uppercase tracking-[0.2em] text-center"
          />
          <button className="btn-primary px-5 text-[11px]">Fulfill</button>
        </form>
      </section>

      <section>
        <h2 className="section-heading">Pending ({pending.length})</h2>
        {pending.length === 0 && (
          <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-3">No pending redemptions.</p>
        )}
        <ul className="flex flex-col gap-2 mt-3">
          {pending.map((r: any) => (
            <li key={r.id} className="postcard p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-serif">{r.reward_name}</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-0.5">
                  @{r.profiles?.username} · {r.restaurants?.name} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="postage">{r.code}</span>
                <form action={setStatusAction.bind(null, r.id, "fulfilled")}>
                  <button className="btn-primary py-1.5 px-3 text-[10px]">Fulfill</button>
                </form>
                <form action={setStatusAction.bind(null, r.id, "cancelled")}>
                  <button className="btn-ghost py-1.5 px-3 text-[10px]">Cancel</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="section-heading">Recent</h2>
          <ul className="flex flex-col gap-1 mt-3">
            {recent.map((r: any) => (
              <li key={r.id} className="border border-[var(--pp-cream-dark)] rounded px-3 py-2 flex items-center justify-between text-sm">
                <span>
                  <span className="font-serif">{r.reward_name}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--pp-ink-soft)]">@{r.profiles?.username}</span>
                </span>
                <span className={`font-mono text-[10px] tracking-[0.2em] uppercase ${r.status === "fulfilled" ? "text-[var(--pp-forest)]" : "text-[var(--pp-ink-soft)]"}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
