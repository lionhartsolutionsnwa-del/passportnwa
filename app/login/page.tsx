"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMsg(error.message);
    } else {
      setStatus("sent");
      setMsg("Check your email for a magic link.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="size-14 mx-auto rounded-full border border-[var(--pp-gold)] flex items-center justify-center bg-[var(--pp-burgundy)]">
            <span className="font-serif text-[var(--pp-gold)] text-2xl leading-none">P</span>
          </div>
          <h1 className="font-serif text-3xl mt-5 text-[var(--pp-ink)]">Passport NWA</h1>
          <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-[var(--pp-ink-soft)] mt-1">
            Northwest Arkansas
          </div>
          <div className="fleuron mt-6">⌑</div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="eyebrow">Travel credentials</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <button
            disabled={status === "loading" || status === "sent"}
            className="btn-primary py-4 text-sm"
          >
            {status === "loading" ? "Sending..." : status === "sent" ? "Sent ✓" : "Send magic link"}
          </button>
          {msg && (
            <p
              className={`font-serif italic text-sm text-center mt-2 ${
                status === "sent" ? "text-[var(--pp-forest)]" : "text-red-700"
              }`}
            >
              {msg}
            </p>
          )}
        </form>

        <p className="text-center font-serif italic text-[var(--pp-ink-soft)] text-sm mt-8">
          "All who wander are not lost — most are just hungry."
        </p>
      </div>
    </main>
  );
}
