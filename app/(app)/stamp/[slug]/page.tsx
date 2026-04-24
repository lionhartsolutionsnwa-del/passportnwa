import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import RateWidget from "@/app/(app)/r/[slug]/rate-widget";

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

  // Look up the restaurant by slug AND token — a mismatch means wrong or fake QR
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

  // Only stamp if the restaurant is actually registered with Passport NWA
  // (has at least one approved owner). Imported-but-unclaimed restaurants are visible
  // in the Atlas but can't be stamped yet.
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

        <Link href="/restaurant-signup" className="btn-primary">
          Share the signup link
        </Link>
        <Link href="/restaurants" className="btn-ghost">
          Back to the Atlas
        </Link>
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

  if (!alreadyStamped) {
    const { error } = await supabase.from("checkins").insert({
      user_id: user.id,
      restaurant_id: restaurant.id,
    });
    if (error) {
      return (
        <ErrorCard title="Couldn't stamp" message={error.message} />
      );
    }
    // Nudge the traveler to rate this spot
    await createNotification({
      userId: user.id,
      kind: "rate_restaurant",
      title: `Rate ${restaurant.name}`,
      body: "Your rating helps us shape the Atlas and future Discover feed.",
      linkUrl: `/r/${restaurant.slug}`,
      restaurantId: restaurant.id,
    });
  }

  // Pull any existing rating so the widget can reflect it
  const { data: existingRating } = await supabase
    .from("restaurant_ratings")
    .select("rating")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <div className="eyebrow mt-4">{alreadyStamped ? "Already stamped" : "Stamped"}</div>
      <h1 className="headline text-4xl">{restaurant.name}</h1>
      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--pp-ink-soft)]">
        {restaurant.city}
      </div>

      <div className="my-4">
        <div
          className="stamp mx-auto"
          style={{ width: 140, height: 140, transform: "rotate(-7deg)" }}
        >
          <span className="stamp-name" style={{ maxWidth: 108, fontSize: 12 }}>
            {restaurant.name}
          </span>
          <span className="stamp-date" style={{ fontSize: 10 }}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
          </span>
        </div>
      </div>

      {alreadyStamped && (
        <p className="font-serif italic text-[var(--pp-ink-soft)] max-w-xs">
          You've already stamped this spot within the last hour.
        </p>
      )}

      <div className="fleuron w-full max-w-xs">⌑</div>

      <div className="w-full max-w-sm">
        <RateWidget
          restaurantId={restaurant.id}
          slug={restaurant.slug}
          initialRating={existingRating?.rating ?? null}
        />
      </div>

      <div className="postcard p-4 max-w-xs w-full text-center">
        <div className="eyebrow">Earn points</div>
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-2">
          Stamps are free. Upload your receipt to turn this visit into redeemable points.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Link href={`/receipt/new?r=${restaurant.slug}`} className="btn-primary py-4">
          Upload receipt for points →
        </Link>
        <Link href={`/post/new?r=${restaurant.slug}&checkedIn=1`} className="btn-ghost">
          Leave a field note
        </Link>
        <Link href={`/r/${restaurant.slug}`} className="text-center font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)] mt-1">
          View destination
        </Link>
      </div>
    </div>
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
