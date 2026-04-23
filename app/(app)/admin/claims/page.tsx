import { createClient } from "@/lib/supabase/server";
import { decideClaimAction } from "./actions";

export default async function ClaimsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("restaurant_claims")
    .select(
      "id, status, role_at_restaurant, contact_phone, message, created_at, profiles(username, display_name), restaurants(id, name, city)",
    )
    .order("created_at", { ascending: false });

  const pending = (claims ?? []).filter((c: any) => c.status === "pending");
  const decided = (claims ?? []).filter((c: any) => c.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Restaurant claims</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">Pending ({pending.length})</h2>
        {pending.length === 0 && <p className="text-white/50 text-sm">No pending claims.</p>}
        <ul className="flex flex-col gap-2">
          {pending.map((c: any) => (
            <li key={c.id} className="border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{c.restaurants?.name} <span className="text-white/40">— {c.restaurants?.city}</span></div>
                  <div className="text-sm text-white/60 mt-1">
                    @{c.profiles?.username} ({c.profiles?.display_name}) — {c.role_at_restaurant ?? "—"}
                  </div>
                  {c.contact_phone && <div className="text-xs text-white/50 mt-1">📞 {c.contact_phone}</div>}
                  {c.message && <p className="text-sm text-white/70 mt-2">"{c.message}"</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <form action={decideClaimAction.bind(null, c.id, "approved")}>
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-medium">
                      Approve
                    </button>
                  </form>
                  <form action={decideClaimAction.bind(null, c.id, "rejected")}>
                    <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">Decided</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {decided.map((c: any) => (
              <li key={c.id} className="flex items-center justify-between border border-white/5 rounded-lg px-3 py-2">
                <span>{c.restaurants?.name} — @{c.profiles?.username}</span>
                <span className={`text-xs ${c.status === "approved" ? "text-emerald-400" : "text-red-400"}`}>
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
