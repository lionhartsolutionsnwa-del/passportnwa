import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import StampLands from "./stamp-lands";

export default async function StampPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t: token } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/stamp/${slug}?t=${token ?? ""}`);

  if (!token) {
    return (
      <ErrorCard
        title="Invalid stamp"
        message="This link is missing its stamp code. Scan the QR at the restaurant itself."
      />
    );
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, city, cover_image_url")
    .eq("slug", slug)
    .eq("check_in_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!restaurant) {
    return (
      <ErrorCard
        title="Stamp not valid"
        message="This stamp code doesn't match any destination. Try scanning again from inside the restaurant."
      />
    );
  }

  // Only registered restaurants can stamp
  const { count: ownerCount } = await supabase
    .from("restaurant_owners")
    .select("user_id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  if ((ownerCount ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-6">
        <div className="eyebrow">Not on Passport NWA yet</div>
        <h1 className="headline text-3xl">{restaurant.name}</h1>
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--pp-ink-soft)]">
          {restaurant.city}
        </div>

        <div className="fleuron w-full max-w-xs">⌑</div>

        <div className="postcard p-5 max-w-sm w-full">
          <p className="font-serif italic text-[var(--pp-ink)] leading-relaxed">
            This restaurant hasn't joined Passport NWA yet, so stamps and points aren't available here.
          </p>
          <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-3">
            Love this spot? Tell the owner or manager to sign up — it's free.
          </p>
        </div>

        <Link href="/restaurant-signup" className="btn-primary">Share the signup link</Link>
        <Link href="/restaurants" className="btn-ghost">Back to the Atlas</Link>
      </div>
    );
  }

  // Rate-limit: prevent double-stamping the same spot within 1 hour
  const { data: recent } = await supabase
    .from("checkins")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant.id)
    .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(1);

  const alreadyStamped = (recent ?? []).length > 0;

  let stampSeed = recent?.[0]?.id ?? "";
  if (!alreadyStamped) {
    const { data: inserted, error } = await supabase
      .from("checkins")
      .insert({ user_id: user.id, restaurant_id: restaurant.id })
      .select("id")
      .single();
    if (error || !inserted) {
      return <ErrorCard title="Couldn't stamp" message={error?.message ?? "Unknown error"} />;
    }
    stampSeed = inserted.id;

    await createNotification({
      userId: user.id,
      kind: "rate_restaurant",
      title: `Rate ${restaurant.name}`,
      body: "Your rating helps shape the Atlas.",
      linkUrl: `/r/${restaurant.slug}`,
      restaurantId: restaurant.id,
    });
  }

  const { data: existingRating } = await supabase
    .from("restaurant_ratings")
    .select("rating")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  return (
    <StampLands
      restaurant={restaurant}
      alreadyStamped={alreadyStamped}
      initialRating={existingRating?.rating ?? null}
      stampSeed={stampSeed || restaurant.id}
    />
  );
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-10">
      <div className="eyebrow text-red-800">Error</div>
      <h1 className="headline text-3xl">{title}</h1>
      <p className="font-serif italic text-[var(--pp-ink-soft)] max-w-xs">{message}</p>
      <Link href="/restaurants" className="btn-ghost mt-2">Back to the Atlas</Link>
    </div>
  );
}
