import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  }

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
