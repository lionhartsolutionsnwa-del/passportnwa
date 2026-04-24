"use client";

import { useState } from "react";

export default function ReferralCard({
  username,
  referredCount,
}: {
  username: string;
  referredCount: number;
}) {
  const link = `https://www.passportnwa.com/login?ref=${encodeURIComponent(username)}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  async function share() {
    const text = `Join me on Passport NWA — stamp your passport at the best spots in NWA. Use my link for +25 points:`;
    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      try {
        await (navigator as any).share({ title: "Passport NWA", text, url: link });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    await copy();
  }

  return (
    <div className="postcard p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Invite companions</div>
          <p className="font-serif italic text-sm text-[var(--pp-ink-soft)] mt-1">
            Share your code. Both of you earn +25 points when they sign up.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-serif text-2xl text-[var(--pp-burgundy)] leading-none">{referredCount}</div>
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-[var(--pp-ink-soft)] mt-1">
            Invited
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[var(--pp-cream-dark)] rounded font-mono text-[11px] text-[var(--pp-ink)]">
        <span className="text-[var(--pp-burgundy)]">@</span>
        <span className="font-bold">{username}</span>
        <span className="text-[var(--pp-ink-soft)] ml-2 truncate">passportnwa.com/login?ref={username}</span>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={copy} className="btn-ghost flex-1 py-2.5 px-4 text-[11px]">
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <button type="button" onClick={share} className="btn-primary flex-1 py-2.5 px-4 text-[11px]">
          Share
        </button>
      </div>
    </div>
  );
}
