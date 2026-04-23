"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchRestaurantsAction, submitRestaurantSignupAction } from "./actions";

type Restaurant = { id: string; name: string; city: string };

type Mode = "existing" | "new";

export default function RestaurantSignupPage() {
  const [mode, setMode] = useState<Mode>("existing");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [pickedRestaurant, setPicked] = useState<Restaurant | null>(null);
  const [pending, startSearch] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function onSearch(v: string) {
    setQ(v);
    if (v.length < 2) return setResults([]);
    startSearch(async () => {
      setResults(await searchRestaurantsAction(v));
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    if (mode === "existing" && pickedRestaurant) {
      fd.set("existing_restaurant_id", pickedRestaurant.id);
    }
    const res = await submitRestaurantSignupAction(fd);
    setSubmitting(false);
    if (res && !res.ok) setError(res.error);
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="max-w-md mx-auto">
        <Link href="/login" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
          ← Back to sign in
        </Link>

        <header className="text-center mt-6">
          <div className="eyebrow">For Restaurants</div>
          <h1 className="headline text-3xl mt-2">Join the Passport</h1>
          <div className="fleuron mt-4">⌑</div>
          <p className="font-serif italic text-[var(--pp-ink-soft)] mt-2 text-sm">
            Register your restaurant, get your own loyalty program, and appear in the Atlas.
          </p>
        </header>

        <div className="postcard p-4 mt-6 text-center">
          <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm">
            After you submit, we'll verify your information in 1–2 business days and get back to you. You won't be able to set rewards or review receipts until your account is approved.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5 mt-6">
          {/* Restaurant selection */}
          <section>
            <div className="eyebrow">Your restaurant</div>
            <div className="flex gap-1 p-1 bg-white/60 border border-[var(--pp-cream-dark)] rounded-full mt-2">
              <ModeTab active={mode === "existing"} onClick={() => setMode("existing")}>In our list</ModeTab>
              <ModeTab active={mode === "new"} onClick={() => setMode("new")}>Not listed</ModeTab>
            </div>

            {mode === "existing" ? (
              <div className="mt-3">
                {pickedRestaurant ? (
                  <div className="postcard p-3 flex items-center justify-between">
                    <div>
                      <div className="font-serif">{pickedRestaurant.name}</div>
                      <div className="font-mono text-[10px] text-[var(--pp-ink-soft)] uppercase tracking-widest">{pickedRestaurant.city}</div>
                    </div>
                    <button type="button" onClick={() => setPicked(null)} className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={q}
                      onChange={(e) => onSearch(e.target.value)}
                      placeholder="Search your restaurant"
                      className="input"
                    />
                    {pending && <span className="absolute right-3 top-3 text-xs text-[var(--pp-ink-soft)]">…</span>}
                    {results.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto bg-white border border-[var(--pp-cream-dark)] rounded shadow-lg">
                        {results.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => { setPicked(r); setResults([]); setQ(""); }}
                              className="w-full text-left px-3 py-2.5 hover:bg-[var(--pp-cream)]"
                            >
                              <span className="font-serif">{r.name}</span>
                              <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2 uppercase tracking-widest">
                                {r.city}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <input name="new_restaurant_name" required={mode === "new"} placeholder="Restaurant name" className="input" />
                <input name="new_restaurant_address" placeholder="Street address" className="input" />
                <select name="new_restaurant_city" required={mode === "new"} className="input" defaultValue="">
                  <option value="" disabled>City</option>
                  {["Bentonville","Rogers","Fayetteville","Springdale","Bella Vista","Centerton","Lowell","Cave Springs","Siloam Springs","Pea Ridge"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Owner info */}
          <section className="flex flex-col gap-3">
            <div className="eyebrow">You</div>
            <input name="full_name" required placeholder="Full legal name" className="input" />
            <input name="role" required placeholder="Role (Owner, GM, Manager, etc.)" className="input" />
            <input name="email" type="email" required placeholder="Your email" className="input" />
            <input
              name="username"
              required
              pattern="[a-zA-Z0-9_]{3,30}"
              placeholder="Username (3-30 chars)"
              className="input"
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Password (8+ characters)"
              className="input"
            />
          </section>

          {/* Business info */}
          <section className="flex flex-col gap-3">
            <div className="eyebrow">Business verification</div>
            <input name="business_name" required placeholder="Business legal name" className="input" />
            <input
              name="ein"
              required
              pattern="\d{2}-?\d{7}"
              placeholder="EIN (XX-XXXXXXX)"
              className="input"
            />
            <input
              name="restaurant_phone"
              type="tel"
              required
              placeholder="Restaurant's public phone"
              className="input"
            />
            <div>
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
                Proof document (business license, sales permit, or utility bill)
              </label>
              <input
                name="verification_doc"
                type="file"
                accept="image/*,.pdf"
                required
                className="block mt-2 text-sm font-mono file:mr-3 file:px-4 file:py-2 file:rounded-full file:border file:border-[var(--pp-burgundy)] file:bg-transparent file:text-[var(--pp-burgundy)] file:font-mono file:text-[10px] file:tracking-[0.2em] file:uppercase"
              />
            </div>
          </section>

          <button
            disabled={submitting || (mode === "existing" && !pickedRestaurant)}
            className="btn-primary py-4 text-sm"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>

          {error && <p className="font-serif italic text-red-700 text-sm text-center">{error}</p>}
        </form>
      </div>
    </main>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-full font-mono text-[10px] tracking-[0.2em] uppercase ${
        active ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)]" : "text-[var(--pp-ink-soft)]"
      }`}
    >
      {children}
    </button>
  );
}
