"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { playStampThunk } from "@/lib/stamp-thunk";
import RateWidget from "@/app/(app)/r/[slug]/rate-widget";

type Restaurant = {
  id: string;
  slug: string;
  name: string;
  city: string;
  cover_image_url: string | null;
};

export default function StampLands({
  restaurant,
  alreadyStamped,
  initialRating,
  stampSeed,
}: {
  restaurant: Restaurant;
  alreadyStamped: boolean;
  initialRating: number | null;
  stampSeed: string;
}) {
  const tilt = useMemo(() => deterministicTilt(stampSeed), [stampSeed]);
  const shake = useAnimationControls();
  const [phase, setPhase] = useState<"verifying" | "dropping" | "landed" | "settled">("verifying");

  useEffect(() => {
    let cancelled = false;
    const t1 = setTimeout(() => !cancelled && setPhase("dropping"), 350);
    const t2 = setTimeout(() => {
      if (cancelled) return;
      setPhase("landed");
      playStampThunk();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([12, 28, 80]);
      }
      shake.start({
        x: [0, -6, 6, -4, 3, 0],
        y: [0, 2, -1, 2, 0, 0],
        transition: { duration: 0.22, times: [0, 0.15, 0.35, 0.55, 0.8, 1] },
      });
    }, 700);
    const t3 = setTimeout(() => !cancelled && setPhase("settled"), 1200);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [shake]);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* COVER PHOTO BACKDROP */}
      <div className="absolute inset-0">
        {restaurant.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.cover_image_url}
            alt=""
            className="absolute inset-0 size-full object-cover scale-110 blur-md"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--pp-burgundy-deep)]/95 via-[var(--pp-burgundy)]/85 to-[var(--pp-ink)]/95" />
        {/* paper grain over the burgundy */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "3px 3px, 7px 7px",
            backgroundPosition: "0 0, 1px 1px",
          }}
        />
      </div>

      <motion.div
        animate={shake}
        className="relative h-full w-full flex flex-col items-center justify-center px-6 py-10"
      >
        {/* TOP BRAND BAR */}
        <div className="absolute top-6 left-0 right-0 flex justify-center">
          <div className="font-mono text-[9px] tracking-[0.5em] text-[var(--pp-gold)]/70">
            PASSPORT NWA
          </div>
        </div>

        {/* VERIFYING TEXT */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "verifying" ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-[35%] font-mono text-[10px] tracking-[0.4em] text-[var(--pp-gold)]/80 uppercase"
        >
          Verifying credentials…
        </motion.div>

        {/* STAMP DROP ZONE */}
        <div className="relative size-64 flex items-center justify-center">
          {/* ink bleed circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={
              phase === "landed" || phase === "settled"
                ? { scale: 3, opacity: [0, 0.45, 0] }
                : { scale: 0, opacity: 0 }
            }
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute size-32 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(91,31,41,0.7) 0%, rgba(91,31,41,0.2) 50%, transparent 80%)",
            }}
          />

          {/* GOLD SPARKLES */}
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i / 14) * Math.PI * 2;
            const distance = 90 + (i % 3) * 10;
            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={
                  phase === "landed" || phase === "settled"
                    ? {
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.5],
                      }
                    : {}
                }
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.02 }}
                className="absolute size-1.5 rounded-full"
                style={{
                  background: "var(--pp-gold)",
                  boxShadow: "0 0 6px var(--pp-gold)",
                }}
              />
            );
          })}

          {/* THE STAMP */}
          <motion.div
            initial={{ y: -340, rotate: tilt - 22, scale: 1.6, opacity: 0 }}
            animate={
              phase === "verifying"
                ? { y: -340, rotate: tilt - 22, scale: 1.6, opacity: 0 }
                : phase === "dropping"
                ? {
                    y: 0,
                    rotate: tilt,
                    scale: 1,
                    opacity: 1,
                    transition: { duration: 0.32, ease: [0.34, 1.4, 0.64, 1] },
                  }
                : phase === "landed"
                ? {
                    y: 0,
                    rotate: tilt,
                    scale: [1, 0.93, 1.06, 1],
                    opacity: 1,
                    transition: { duration: 0.45, times: [0, 0.25, 0.6, 1] },
                  }
                : { y: 0, rotate: tilt, scale: 1, opacity: 1 }
            }
            className="stamp"
            style={{ width: 156, height: 156 }}
          >
            <span className="stamp-name" style={{ maxWidth: 110, fontSize: 12 }}>
              {restaurant.name}
            </span>
            <span className="stamp-date" style={{ fontSize: 10 }}>
              {today}
            </span>
          </motion.div>
        </div>

        {/* RESTAURANT REVEAL */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={
            phase === "landed" || phase === "settled" ? { opacity: 1, y: 0 } : {}
          }
          transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
          className="text-center mt-8 max-w-sm"
        >
          <div className="font-mono text-[10px] tracking-[0.4em] text-[var(--pp-gold)] uppercase">
            {alreadyStamped ? "Already in your passport" : "Stamped"}
          </div>
          <h1 className="font-serif text-3xl text-[var(--pp-cream)] mt-2 leading-tight">
            {restaurant.name}
          </h1>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--pp-cream)]/60 mt-2">
            {restaurant.city}
          </div>
        </motion.div>

        {/* RATE + ACTIONS — appear after settle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={phase === "settled" ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm mt-8 flex flex-col gap-3"
        >
          <div className="rounded-lg overflow-hidden">
            <RateWidget
              restaurantId={restaurant.id}
              slug={restaurant.slug}
              initialRating={initialRating}
            />
          </div>

          <Link
            href={`/post/new?r=${restaurant.slug}&checkedIn=1`}
            className="btn-primary w-full py-3.5 text-[11px] bg-[var(--pp-gold)] text-[var(--pp-ink)]"
          >
            Leave a field note →
          </Link>
          <Link
            href={`/r/${restaurant.slug}`}
            className="text-center font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--pp-cream)]/60 hover:text-[var(--pp-cream)]"
          >
            View destination
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

function deterministicTilt(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((h % 17) - 8); // -8 to +8 degrees
}
