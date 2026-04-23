import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRewardAction, toggleRewardAction, deleteRewardAction } from "./actions";

export default async function RewardsManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("restaurant_owners")
    .select("restaurant_id, restaurants(id, slug, name, city)")
    .eq("user_id", user.id);

  if (!owned?.length) redirect("/dashboard");

  const restaurantIds = owned.map((o: any) => o.restaurant_id);
  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, restaurant_id, name, description, points_cost, is_active")
    .in("restaurant_id", restaurantIds)
    .order("restaurant_id")
    .order("points_cost");

  const byRestaurant = new Map<string, typeof rewards>();
  for (const r of rewards ?? []) {
    const list = byRestaurant.get(r.restaurant_id) ?? ([] as any);
    list.push(r);
    byRestaurant.set(r.restaurant_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
          ← Concierge
        </Link>
        <h1 className="headline text-3xl mt-2">Rewards</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] mt-1 text-sm">
          Define what travelers can spend their points on at your destination.
        </p>
      </header>

      {(owned as any[]).map((o) => {
        const r = o.restaurants;
        const list = byRestaurant.get(o.restaurant_id) ?? [];
        return (
          <section key={o.restaurant_id} className="flex flex-col gap-3">
            <h2 className="section-heading">{r.name}</h2>

            <ul className="flex flex-col gap-2">
              {list.length === 0 && (
                <li className="font-serif italic text-[var(--pp-ink-soft)] text-sm">
                  No rewards yet.
                </li>
              )}
              {list.map((rw: any) => (
                <li key={rw.id} className="postcard p-3 flex items-center justify-between gap-3">
                  <div className={rw.is_active ? "" : "opacity-50"}>
                    <div className="font-serif">{rw.name}</div>
                    {rw.description && (
                      <div className="font-serif italic text-sm text-[var(--pp-ink-soft)]">{rw.description}</div>
                    )}
                    <div className="mt-1 postage inline-flex">
                      <span className="star">★</span> {rw.points_cost}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <form action={toggleRewardAction.bind(null, rw.id, !rw.is_active)}>
                      <button className="font-mono text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5 rounded border border-[var(--pp-cream-dark)]">
                        {rw.is_active ? "Pause" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteRewardAction.bind(null, rw.id)}>
                      <button className="font-mono text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5 rounded border border-red-700/40 text-red-700">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            <form action={createRewardAction.bind(null, o.restaurant_id)} className="postcard p-4 flex flex-col gap-2">
              <div className="eyebrow">Add a reward</div>
              <input name="name" required placeholder="e.g. House-made cookie" className="input" />
              <input name="description" placeholder="Short description (optional)" className="input" />
              <div className="flex items-center input p-0 w-40">
                <span className="px-3 font-mono text-[var(--pp-ink-soft)]">★</span>
                <input name="points_cost" type="number" min="1" max="10000" required placeholder="Points cost" className="flex-1 py-3 pr-3 bg-transparent outline-none font-mono" />
              </div>
              <button className="btn-primary py-2.5 px-4 text-[11px] self-start">Add reward</button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
