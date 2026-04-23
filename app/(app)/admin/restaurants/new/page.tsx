"use client";

import { useState, useTransition } from "react";
import { searchAction, createRestaurantAction } from "./actions";
import type { PlaceSuggestion } from "@/lib/google-places";

export default function AddRestaurantPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<PlaceSuggestion | null>(null);
  const [msg, setMsg] = useState("");

  function search() {
    if (!q.trim()) return;
    startTransition(async () => {
      try {
        const r = await searchAction(q);
        setResults(r);
        setMsg("");
      } catch (e: any) {
        setMsg(e.message);
      }
    });
  }

  async function save(formData: FormData) {
    setMsg("");
    if (!picked) return;
    formData.set("placeId", picked.placeId);
    formData.set("photoUrl", picked.photoUrl ?? "");
    const r = await createRestaurantAction(formData);
    if (r.ok) {
      setMsg(`Saved ${r.name}`);
      setPicked(null);
      setQ("");
      setResults([]);
    } else {
      setMsg(r.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add restaurant</h1>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search Google Places (e.g. 'Conifer Bentonville')"
          className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none"
        />
        <button
          onClick={search}
          disabled={pending}
          className="px-4 py-3 rounded-lg bg-white text-black font-semibold disabled:opacity-50"
        >
          {pending ? "..." : "Search"}
        </button>
      </div>

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}

      {!picked && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li key={r.placeId}>
              <button
                onClick={() => setPicked(r)}
                className="w-full text-left border border-white/10 rounded-xl p-3 hover:bg-white/5"
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-white/50">{r.address}</div>
                {r.cuisine && <div className="text-xs text-white/40 mt-1">{r.cuisine}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked && (
        <form action={save} className="flex flex-col gap-3 border border-white/10 rounded-xl p-4">
          <div className="text-xs uppercase tracking-widest text-white/50">Confirm</div>
          {picked.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picked.photoUrl} alt="" className="w-full max-h-48 object-cover rounded-lg" />
          )}
          <input
            name="name"
            defaultValue={picked.name}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            required
          />
          <input
            name="city"
            defaultValue={picked.city}
            placeholder="City"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            required
          />
          <input
            name="cuisine"
            defaultValue={picked.cuisine ?? ""}
            placeholder="Cuisine"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
          />
          <input
            name="address"
            defaultValue={picked.address}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
          />
          <textarea
            name="description"
            placeholder="Short description (1-2 sentences)"
            rows={2}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none resize-none"
          />
          <input type="hidden" name="lat" value={picked.lat ?? ""} />
          <input type="hidden" name="lng" value={picked.lng ?? ""} />
          <input type="hidden" name="website" value={picked.website ?? ""} />
          <input type="hidden" name="phone" value={picked.phone ?? ""} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setPicked(null)} className="px-4 py-2 rounded-lg border border-white/10">
              Back
            </button>
            <button className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-semibold">
              Save restaurant
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
