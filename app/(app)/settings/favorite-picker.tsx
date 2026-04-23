"use client";

import { useState, useTransition } from "react";
import { searchRestaurantsAction } from "./actions";

type Restaurant = { id: string; name: string; city: string };

export default function FavoritePicker({ initial }: { initial: Restaurant[] }) {
  const [favorites, setFavorites] = useState<Restaurant[]>(initial);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [pending, startTransition] = useTransition();

  function onSearch(value: string) {
    setQ(value);
    if (value.length < 2) { setResults([]); return; }
    startTransition(async () => {
      const r = await searchRestaurantsAction(value);
      setResults(r);
    });
  }

  function add(r: Restaurant) {
    if (favorites.length >= 3 || favorites.some((f) => f.id === r.id)) return;
    setFavorites([...favorites, r]);
    setQ("");
    setResults([]);
  }

  function remove(id: string) {
    setFavorites(favorites.filter((f) => f.id !== id));
  }

  return (
    <div>
      <label className="eyebrow">Three favorite destinations</label>
      <input type="hidden" name="favorites" value={favorites.map((f) => f.id).join(",")} />

      <ul className="mt-2 flex flex-col gap-1.5">
        {favorites.map((f, i) => (
          <li
            key={f.id}
            className="postcard flex items-center justify-between px-3 py-2.5"
          >
            <span className="flex items-center gap-3">
              <span className="font-serif text-[var(--pp-gold)] text-lg">№{i + 1}</span>
              <span>
                <span className="font-serif text-[var(--pp-ink)]">{f.name}</span>
                <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2 tracking-wider uppercase">
                  {f.city}
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]"
            >
              Remove
            </button>
          </li>
        ))}
        {favorites.length < 3 &&
          Array.from({ length: 3 - favorites.length }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="border border-dashed border-[var(--pp-cream-dark)] rounded px-3 py-2.5 font-serif italic text-[var(--pp-ink-soft)]/60 text-sm"
            >
              Empty slot №{favorites.length + i + 1}
            </li>
          ))}
      </ul>

      {favorites.length < 3 && (
        <div className="mt-3 relative">
          <input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search to pin…"
            className="input"
          />
          {pending && <span className="absolute right-3 top-3 font-mono text-xs text-[var(--pp-ink-soft)]">…</span>}
          {results.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto bg-white border border-[var(--pp-cream-dark)] rounded shadow-lg">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => add(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[var(--pp-cream)]"
                  >
                    <span className="font-serif text-[var(--pp-ink)]">{r.name}</span>
                    <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2 uppercase tracking-wider">
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
  );
}
