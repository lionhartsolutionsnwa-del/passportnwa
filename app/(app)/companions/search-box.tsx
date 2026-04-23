"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findUserAction } from "./actions";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "notfound">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    const handle = q.trim().replace(/^@/, "");
    if (!handle) {
      setStatus("idle");
      return;
    }
    const res = await findUserAction(handle);
    if (res?.username) {
      router.push(`/u/${res.username}`);
    } else {
      setStatus("notfound");
      setMsg(`No traveler with the exact username "@${handle}"`);
    }
  }

  return (
    <form onSubmit={submit} className="postcard p-4 flex flex-col gap-2">
      <label className="eyebrow">Find a companion</label>
      <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm">
        Enter their exact username — no search, no partial matches.
      </p>
      <div className="flex items-center input p-0">
        <span className="px-3 font-mono text-[var(--pp-ink-soft)]">@</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="exactusername"
          autoComplete="off"
          autoCapitalize="none"
          className="flex-1 py-3 pr-3 bg-transparent outline-none font-mono"
        />
      </div>
      <button disabled={status === "loading" || !q.trim()} className="btn-primary py-2.5 px-4 text-[11px] self-start disabled:opacity-50">
        {status === "loading" ? "Searching…" : "Find"}
      </button>
      {status === "notfound" && (
        <p className="font-serif italic text-red-700 text-sm">{msg}</p>
      )}
    </form>
  );
}
