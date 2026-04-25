"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { completeOnboardingAction } from "./actions";

export default function WelcomeAnimation({
  displayName,
  passportNo,
}: {
  displayName: string;
  passportNo: string;
}) {
  const [phase, setPhase] = useState<
    "intro" | "book" | "opening" | "open" | "welcome" | "name" | "ready"
  >("intro");
  const [pending, start] = useTransition();

  useEffect(() => {
    const t = [
      setTimeout(() => setPhase("book"), 300),
      setTimeout(() => setPhase("opening"), 1300),
      setTimeout(() => setPhase("open"), 2200),
      setTimeout(() => setPhase("welcome"), 2400),
      setTimeout(() => setPhase("name"), 3000),
      setTimeout(() => setPhase("ready"), 4000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  function begin() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(15);
    }
    start(() => {
      completeOnboardingAction();
    });
  }

  function skip() {
    start(() => completeOnboardingAction());
  }

  return (
    <main className="fixed inset-0 z-50 overflow-hidden">
      {/* BACKDROP */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--pp-burgundy-deep)] via-[var(--pp-burgundy)] to-[var(--pp-ink)]" />
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
            backgroundSize: "3px 3px, 7px 7px",
            backgroundPosition: "0 0, 1px 1px",
          }}
        />
        {/* Soft gold halo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,161,74,0.4) 0%, transparent 55%)",
          }}
        />
      </div>

      {/* SKIP */}
      <button
        onClick={skip}
        disabled={pending}
        className="absolute top-6 right-6 font-mono text-[10px] tracking-[0.25em] uppercase text-[var(--pp-cream)]/50 hover:text-[var(--pp-cream)] z-30"
      >
        Skip
      </button>

      {/* PASSPORT BOOK STAGE */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6" style={{ perspective: 1400 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={
            phase === "intro"
              ? { scale: 0.7, opacity: 0, y: 20 }
              : phase === "book"
              ? { scale: 1, opacity: 1, y: [-4, 4, -4] }
              : phase === "opening" || phase === "open" || phase === "welcome" || phase === "name" || phase === "ready"
              ? { scale: 1, opacity: 1, y: 0 }
              : {}
          }
          transition={
            phase === "book"
              ? { scale: { duration: 0.7, ease: "easeOut" }, opacity: { duration: 0.5 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
              : { duration: 0.4 }
          }
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* PASSPORT COVER (the closed book that opens) */}
          <motion.div
            initial={{ rotateY: 0 }}
            animate={
              phase === "opening" || phase === "open" || phase === "welcome" || phase === "name" || phase === "ready"
                ? { rotateY: -170, opacity: [1, 1, 0] }
                : {}
            }
            transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1], times: [0, 0.7, 1] }}
            className="relative"
            style={{
              width: 220,
              height: 300,
              transformStyle: "preserve-3d",
              transformOrigin: "left center",
            }}
          >
            <div
              className="absolute inset-0 rounded-md flex flex-col items-center justify-center text-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--pp-burgundy) 0%, var(--pp-burgundy-deep) 100%)",
                boxShadow:
                  "0 25px 60px -10px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(201,161,74,0.4)",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Inner border */}
              <div
                className="absolute inset-3 rounded-sm"
                style={{ border: "1px solid rgba(201,161,74,0.5)" }}
              />

              {/* Top crest */}
              <div className="font-mono text-[8px] tracking-[0.5em] foil mt-4">
                ✦ ✦ ✦
              </div>

              {/* Wordmark */}
              <div className="mt-10 px-4">
                <div className="font-mono text-[9px] tracking-[0.4em] text-[var(--pp-gold)]/70">
                  UNITED STATES OF
                </div>
                <div className="font-serif text-2xl foil mt-2 leading-tight">
                  PASSPORT
                </div>
                <div className="font-serif text-3xl foil leading-tight">NWA</div>
              </div>

              {/* Center seal */}
              <div className="mt-8">
                <div className="size-14 mx-auto rounded-full border border-[var(--pp-gold)]/60 flex items-center justify-center">
                  <span className="font-serif text-[var(--pp-gold)] text-2xl">P</span>
                </div>
              </div>

              {/* Bottom */}
              <div className="absolute bottom-5 left-0 right-0 text-center">
                <div className="font-mono text-[8px] tracking-[0.4em] text-[var(--pp-gold)]/60">
                  EST · 2026
                </div>
              </div>

              {/* Foil shimmer sweep across the cover during opening */}
              {(phase === "opening" || phase === "book") && (
                <motion.div
                  initial={{ x: "-120%", opacity: 0 }}
                  animate={
                    phase === "opening"
                      ? { x: "120%", opacity: [0, 0.8, 0] }
                      : { x: "-120%", opacity: 0 }
                  }
                  transition={{ duration: 1.0, ease: "easeInOut" }}
                  className="absolute inset-0 pointer-events-none rounded-md"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 35%, rgba(255,248,224,0.5) 50%, transparent 65%)",
                    mixBlendMode: "overlay",
                  }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* INNER PAGE — appears as cover finishes opening */}
        <AnimatePresence>
          {(phase === "open" || phase === "welcome" || phase === "name" || phase === "ready") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <AnimatePresence>
                {(phase === "welcome" || phase === "name" || phase === "ready") && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="font-mono text-[11px] tracking-[0.5em] uppercase"
                    style={{ color: "var(--pp-gold)" }}
                  >
                    Welcome aboard
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(phase === "name" || phase === "ready") && (
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="font-serif text-5xl text-[var(--pp-cream)] mt-4 leading-tight max-w-xs foil"
                  >
                    {displayName}
                  </motion.h1>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(phase === "name" || phase === "ready") && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 flex flex-col items-center gap-3"
                  >
                    <div className="crest">Explorer · L-0</div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--pp-cream)]/50 mt-1">
                      PASSPORT № {passportNo}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === "ready" && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mt-12 flex flex-col items-center gap-4"
                  >
                    <p className="font-serif italic text-[var(--pp-cream)]/70 text-sm max-w-xs">
                      Stamp your passport at every great spot in Northwest Arkansas. Your travels start now.
                    </p>
                    <button
                      onClick={begin}
                      disabled={pending}
                      className="px-8 py-3.5 rounded-full font-mono text-[11px] tracking-[0.3em] uppercase bg-[var(--pp-gold)] text-[var(--pp-ink)] hover:bg-[var(--pp-gold-soft)] disabled:opacity-50"
                    >
                      {pending ? "Opening…" : "Begin your travels →"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
