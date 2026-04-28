"use client";

import Link from "next/link";
import { useState } from "react";

type Stamp = {
  id: string;
  created_at: string;
  restaurants: { slug: string; name: string; city: string } | null;
};

type Post = {
  id: string;
  photo_url: string | null;
  caption: string | null;
  restaurants: { slug: string; name: string } | null;
};

function tilt(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (h % 17) - 8;
}

export default function ProfileTabs({
  stamps,
  posts,
}: {
  stamps: Stamp[];
  posts: Post[];
}) {
  const hasStamps = stamps.length > 0;
  const hasPosts = posts.length > 0;
  if (!hasStamps && !hasPosts) {
    return (
      <section className="mx-6 mt-8">
        <h2 className="section-heading">Travels</h2>
        <p className="font-serif italic text-[var(--pp-ink)]/50 mt-3 text-sm">
          No stamps yet. <Link href="/restaurants" className="underline text-[var(--pp-burgundy)]">Begin your travels →</Link>
        </p>
      </section>
    );
  }

  const [tab, setTab] = useState<"stamps" | "notes">(hasStamps ? "stamps" : "notes");

  return (
    <section className="mx-6 mt-8">
      <div className="flex items-center gap-2 border-b border-[var(--pp-burgundy)]/15 pb-1">
        <button
          type="button"
          onClick={() => setTab("stamps")}
          disabled={!hasStamps}
          className={`px-3 py-2 font-mono text-[11px] tracking-[0.28em] uppercase border-b-2 -mb-px transition-colors ${
            tab === "stamps"
              ? "text-[var(--pp-burgundy)] border-[var(--pp-burgundy)]"
              : "text-[var(--pp-ink)]/45 border-transparent hover:text-[var(--pp-ink)] disabled:opacity-30"
          }`}
        >
          Visa stamps · {stamps.length}
        </button>
        <button
          type="button"
          onClick={() => setTab("notes")}
          disabled={!hasPosts}
          className={`px-3 py-2 font-mono text-[11px] tracking-[0.28em] uppercase border-b-2 -mb-px transition-colors ${
            tab === "notes"
              ? "text-[var(--pp-burgundy)] border-[var(--pp-burgundy)]"
              : "text-[var(--pp-ink)]/45 border-transparent hover:text-[var(--pp-ink)] disabled:opacity-30"
          }`}
        >
          Field notes · {posts.length}
        </button>
      </div>

      {tab === "stamps" && hasStamps && (
        <div className="mt-4 flex flex-wrap gap-3 justify-start">
          {stamps.map((s) => (
            <Link
              key={s.id}
              href={`/r/${s.restaurants?.slug ?? ""}`}
              className="stamp"
              style={{ transform: `rotate(${tilt(s.id)}deg)` }}
              title={`${s.restaurants?.name} · ${new Date(s.created_at).toLocaleDateString()}`}
            >
              <span className="stamp-name">{s.restaurants?.name}</span>
              <span className="stamp-date">
                {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "2-digit" })}
              </span>
            </Link>
          ))}
        </div>
      )}

      {tab === "notes" && hasPosts && (
        <div className="grid grid-cols-3 gap-1 mt-4">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/r/${p.restaurants?.slug ?? ""}`}
              className="aspect-square overflow-hidden border border-[var(--pp-burgundy)]/15 bg-[var(--pp-cream-dark)]"
            >
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt="" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-[10px] font-serif italic text-[var(--pp-ink)]/60 p-2 text-center">
                  {p.caption?.slice(0, 60) ?? "—"}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
