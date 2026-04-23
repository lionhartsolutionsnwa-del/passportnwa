import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RedemptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: red } = await supabase
    .from("redemptions")
    .select("id, code, reward_name, points_spent, status, created_at, restaurants(slug, name, city)")
    .eq("id", id)
    .maybeSingle();

  if (!red) notFound();

  const statusLabel: Record<string, string> = {
    pending: "Awaiting fulfillment",
    fulfilled: "Redeemed",
    cancelled: "Cancelled",
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center py-6">
      <Link href="/" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] self-start">
        ← Journal
      </Link>

      <div className="eyebrow">{statusLabel[red.status]}</div>
      <h1 className="headline text-3xl">{red.reward_name}</h1>
      <p className="font-serif italic text-[var(--pp-ink-soft)]">
        at {(red.restaurants as any)?.name} · {(red.restaurants as any)?.city}
      </p>

      <div className="fleuron w-full max-w-xs">⌑</div>

      {red.status === "pending" ? (
        <>
          <div className="postcard p-8 w-full max-w-xs">
            <div className="eyebrow">Show this code to staff</div>
            <div className="font-mono text-[48px] tracking-[0.25em] text-[var(--pp-burgundy)] mt-3 font-bold">
              {red.code}
            </div>
          </div>
          <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm max-w-xs">
            Staff will verify this code in the Concierge to fulfill your redemption.
          </p>
          <div className="postage mt-2">−<span className="star">★</span> {red.points_spent}</div>
        </>
      ) : (
        <div className="postcard p-6 w-full max-w-xs">
          <p className="font-serif italic text-[var(--pp-ink-soft)]">
            This redemption is {red.status}.
          </p>
        </div>
      )}

      <Link href={`/r/${(red.restaurants as any)?.slug}`} className="btn-ghost mt-3">
        Back to destination
      </Link>
    </div>
  );
}
