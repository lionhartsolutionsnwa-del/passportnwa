"use client";

import { useState, useTransition } from "react";
import { saveRatingAction } from "./rate-actions";

export default function RateWidget({
  restaurantId,
  slug,
  initialRating,
}: {
  restaurantId: string;
  slug: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(value: number) {
    setRating(value);
    setSaved(false);
    startTransition(async () => {
      await saveRatingAction(restaurantId, slug, value);
      setSaved(true);
    });
  }

  const display = hover ?? rating ?? 0;

  return (
    <div className="postcard p-5 text-center">
      <div className="eyebrow">How was it?</div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => pick(n)}
            disabled={pending}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="text-3xl leading-none transition-transform hover:scale-110"
            style={{ color: n <= display ? "var(--pp-gold)" : "var(--pp-cream-dark)" }}
          >
            ★
          </button>
        ))}
      </div>
      <p className="mt-3 font-serif italic text-sm text-[var(--pp-ink-soft)]">
        {saved
          ? `Saved — ${rating} star${rating === 1 ? "" : "s"}. Thanks for the signal.`
          : rating
          ? `Your rating: ${rating} star${rating === 1 ? "" : "s"}`
          : "Tap a star to rate this spot."}
      </p>
    </div>
  );
}
