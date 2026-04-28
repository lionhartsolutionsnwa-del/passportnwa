"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { completeOnboardingAction } from "./actions";

type Phase = "intro" | "logo" | "ring" | "welcome" | "name" | "ready";

export default function WelcomeAnimation({
  displayName,
  passportNo,
}: {
  displayName: string;
  passportNo: string;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [pending, start] = useTransition();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("logo"), 300),
      setTimeout(() => setPhase("ring"), 1100),
      setTimeout(() => setPhase("welcome"), 1700),
      setTimeout(() => setPhase("name"), 2400),
      setTimeout(() => setPhase("ready"), 3300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  function begin() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
    start(() => completeOnboardingAction());
  }

  function skip() {
    start(() => completeOnboardingAction());
  }

  const ready = phase === "ready";
  const showWelcome = phase === "welcome" || phase === "name" || phase === "ready";
  const showName = phase === "name" || phase === "ready";

  return (
    <main
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse at center, #5b1f29 0%, #3d1219 70%, #2a1a0e 100%)",
      }}
    >
      {/* Paper grain overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 7px 7px",
          backgroundPosition: "0 0, 1px 1px",
        }}
      />

      {/* Soft gold halo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(201,161,74,0.45), transparent 55%)",
        }}
      />

      {/* Skip button */}
      <button
        type="button"
        onClick={skip}
        disabled={pending}
        className="absolute top-5 right-5 z-30 font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--pp-cream)]/60 hover:text-[var(--pp-cream)] px-3 py-1.5"
      >
        Skip
      </button>

      {/* Top brand caption */}
      <div className="absolute top-7 left-0 right-0 z-10 text-center pointer-events-none">
        <div className="font-mono text-[10px] tracking-[0.5em] text-[var(--pp-gold)]/70">
          PASSPORT NWA
        </div>
      </div>

      {/* Centered content stack */}
      <div
        className="relative z-20 flex flex-col items-center justify-center px-6 py-16 mx-auto"
        style={{ minHeight: "100dvh", maxWidth: 480 }}
      >
        {/* LOGO + EXPANDING RING */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          {/* Expanding gold ring (like a stamp dropping) */}
          <motion.div
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={
              phase === "ring" || showWelcome
                ? { scale: [0.4, 1.6], opacity: [0.7, 0] }
                : { scale: 0.4, opacity: 0 }
            }
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid var(--pp-gold)",
              boxShadow: "0 0 30px rgba(201,161,74,0.6)",
            }}
          />

          {/* Second pulse ring */}
          <motion.div
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={
              showWelcome
                ? { scale: [0.6, 2], opacity: [0.5, 0] }
                : { scale: 0.4, opacity: 0 }
            }
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.25 }}
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid var(--pp-gold-soft)" }}
          />

          {/* The logo itself */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
            animate={
              phase === "intro"
                ? { scale: 0.4, opacity: 0, rotate: -20 }
                : { scale: 1, opacity: 1, rotate: 0 }
            }
            transition={{ duration: 0.7, ease: [0.34, 1.5, 0.64, 1] }}
            className="relative z-10"
          >
            <motion.div
              animate={
                showWelcome
                  ? { y: [0, -4, 0] }
                  : { y: 0 }
              }
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Passport NWA"
                width={180}
                height={180}
                className="rounded-full"
                style={{
                  boxShadow: "0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 4px rgba(201,161,74,0.25)",
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* WELCOME LABEL */}
        <div className="mt-12 min-h-[28px] flex items-center justify-center">
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="font-mono text-[11px] tracking-[0.5em] uppercase"
                style={{ color: "var(--pp-gold)" }}
              >
                Welcome aboard
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DISPLAY NAME — the headline moment */}
        <div className="mt-3 min-h-[60px] text-center">
          <AnimatePresence>
            {showName && (
              <motion.h1
                key="name"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="font-serif text-4xl sm:text-5xl leading-[1.05] foil"
              >
                {displayName}
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* CREST + PASSPORT NUMBER */}
        <div className="mt-6 min-h-[48px] flex flex-col items-center gap-2">
          <AnimatePresence>
            {showName && (
              <motion.div
                key="crest"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="crest">Explorer · L-0</span>
                <div className="font-mono text-[10px] tracking-[0.3em] text-[var(--pp-cream)]/55">
                  PASSPORT № {passportNo}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TAGLINE + CTA */}
        <div className="mt-12 min-h-[140px] w-full flex flex-col items-center gap-4">
          <AnimatePresence>
            {ready && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-5 w-full"
              >
                <p className="font-serif italic text-[var(--pp-cream)]/75 text-center text-sm sm:text-base max-w-xs leading-relaxed">
                  Stamp your passport at every great spot in Northwest Arkansas. Your travels start now.
                </p>
                <button
                  type="button"
                  onClick={begin}
                  disabled={pending}
                  className="px-8 py-3.5 rounded-full font-mono text-[11px] tracking-[0.3em] uppercase bg-[var(--pp-gold)] text-[var(--pp-ink)] hover:bg-[var(--pp-gold-soft)] disabled:opacity-50 transition-colors shadow-[0_8px_24px_-4px_rgba(201,161,74,0.5)]"
                >
                  {pending ? "Opening…" : "Begin your travels →"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
