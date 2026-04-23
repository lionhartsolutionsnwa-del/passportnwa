import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { submitClaimAction } from "./actions";

export default async function ClaimPage() {
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, city")
    .eq("is_active", true)
    .order("name");

  const { data: { user } } = await supabase.auth.getUser();
  const { data: myClaims } = user
    ? await supabase
        .from("restaurant_claims")
        .select("id, status, restaurant_id, restaurants(name, city)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Claim your restaurant</h1>
        <p className="text-white/60 text-sm mt-1">
          Owners and managers — claim your spot to access the dashboard once approved.
        </p>
      </header>

      <form action={submitClaimAction} className="flex flex-col gap-3">
        <label className="text-sm text-white/60">Restaurant</label>
        <select
          name="restaurant_id"
          required
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none"
        >
          <option value="">Select your restaurant</option>
          {restaurants?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.city}
            </option>
          ))}
        </select>

        <label className="text-sm text-white/60 mt-2">Your role</label>
        <input
          name="role"
          required
          placeholder="Owner / GM / Manager"
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none"
        />

        <label className="text-sm text-white/60 mt-2">Phone (for verification)</label>
        <input
          name="phone"
          type="tel"
          placeholder="(479) 555-0100"
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none"
        />

        <label className="text-sm text-white/60 mt-2">Note (optional)</label>
        <textarea
          name="message"
          rows={3}
          placeholder="Anything we should know"
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none resize-none"
        />

        <button className="mt-2 px-6 py-3 rounded-lg bg-[var(--accent)] text-black font-semibold">
          Submit claim
        </button>
      </form>

      {myClaims && myClaims.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">Your claims</h2>
          <ul className="flex flex-col gap-2">
            {myClaims.map((c: any) => (
              <li key={c.id} className="border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.restaurants?.name}</div>
                  <div className="text-xs text-white/50">{c.restaurants?.city}</div>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300",
    approved: "bg-emerald-500/20 text-emerald-300",
    rejected: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status] ?? "bg-white/10"}`}>
      {status}
    </span>
  );
}
