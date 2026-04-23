import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redeemRewardAction } from "./actions";

export default async function RestaurantRewardsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, city")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, name, description, points_cost")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("sort_order")
    .order("points_cost");

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/r/${restaurant.slug}`} className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
        ← {restaurant.name}
      </Link>

      <header>
        <div className="eyebrow">{restaurant.name}</div>
        <h1 className="headline text-3xl mt-1">Rewards</h1>
        <div className="mt-3 postage">Your balance · <span className="star">★</span> {profile?.points ?? 0}</div>
      </header>

      {!rewards?.length && (
        <div className="postcard p-6 text-center">
          <p className="font-serif italic text-[var(--pp-ink-soft)]">
            This restaurant hasn't listed any rewards yet.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {rewards?.map((r) => {
          const canAfford = (profile?.points ?? 0) >= r.points_cost;
          return (
            <li key={r.id} className="postcard p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-serif text-lg">{r.name}</div>
                {r.description && (
                  <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-1">{r.description}</p>
                )}
                <div className="mt-2 postage">
                  <span className="star">★</span> {r.points_cost}
                </div>
              </div>
              <form action={redeemRewardAction.bind(null, r.id, restaurant.slug)}>
                <button
                  disabled={!canAfford}
                  className={canAfford ? "btn-primary py-3 px-5 text-[11px]" : "btn-ghost py-3 px-5 text-[11px] opacity-40"}
                >
                  {canAfford ? "Redeem" : "Need more"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
