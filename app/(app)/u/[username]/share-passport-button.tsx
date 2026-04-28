"use client";

import { useState } from "react";

export default function SharePassportButton({ username }: { username: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function share() {
    setBusy(true);
    setMsg("");
    const url = `/api/share-card/${encodeURIComponent(username)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Couldn't generate card");
      const blob = await res.blob();
      const file = new File([blob], `passport-${username}.png`, { type: "image/png" });

      // Native share with file (iOS, Android Chrome)
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          title: "My Passport NWA",
          text: `Join me on Passport NWA — earn 25 points when you sign up with my code: passportnwa.com/login?ref=${username}`,
          files: [file],
        });
        return;
      }

      // Fallback — open the image in a new tab so user can long-press / save
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      setMsg("Opened in a new tab — save the image to share.");
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMsg(e?.message ?? "Couldn't share — try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  function preview() {
    window.open(`/api/share-card/${encodeURIComponent(username)}`, "_blank", "noopener");
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="btn-primary w-full justify-center"
        style={{ background: "var(--pp-gold)", color: "var(--pp-ink)" }}
      >
        {busy ? "Preparing…" : "Share my Passport"}
      </button>
      <button
        type="button"
        onClick={preview}
        disabled={busy}
        className="text-center font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--pp-cream)]/60 hover:text-[var(--pp-cream)] py-2"
      >
        Preview the card
      </button>
      {msg && (
        <p className="font-serif italic text-[var(--pp-cream)]/70 text-sm text-center">{msg}</p>
      )}
    </div>
  );
}
