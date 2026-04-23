import { createAdminClient } from "@/lib/supabase/admin";
import { decideClaimAction } from "./actions";

export default async function ClaimsPage() {
  const admin = createAdminClient();

  // 1) Fetch claims (no joins)
  const { data: claimsRaw, error } = await admin
    .from("restaurant_claims")
    .select("id, status, role_at_restaurant, contact_phone, message, owner_full_name, business_legal_name, ein, verification_doc_path, created_at, user_id, restaurant_id")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="postcard p-4 border-red-700 border-2">
        <div className="eyebrow text-red-700">Error loading claims</div>
        <pre className="font-mono text-xs mt-2 whitespace-pre-wrap">{error.message}</pre>
      </div>
    );
  }

  const claims = claimsRaw ?? [];

  // 2) Gather related user/restaurant IDs, batch-fetch in one query each
  const userIds = Array.from(new Set(claims.map((c) => c.user_id)));
  const restIds = Array.from(new Set(claims.map((c) => c.restaurant_id)));

  const [{ data: profiles }, { data: restaurants }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, username, display_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
    restIds.length
      ? admin.from("restaurants").select("id, name, city, is_active").in("id", restIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const restById    = new Map((restaurants ?? []).map((r: any) => [r.id, r]));

  // 3) Sign doc URLs, merge joins into each claim
  const decorated = await Promise.all(
    claims.map(async (c: any) => {
      let signedUrl: string | null = null;
      if (c.verification_doc_path) {
        const { data } = await admin.storage
          .from("verification")
          .createSignedUrl(c.verification_doc_path, 3600);
        signedUrl = data?.signedUrl ?? null;
      }
      return {
        ...c,
        profile: profileById.get(c.user_id) ?? null,
        restaurant: restById.get(c.restaurant_id) ?? null,
        verification_signed_url: signedUrl,
      };
    }),
  );

  const pending = decorated.filter((c) => c.status === "pending");
  const decided = decorated.filter((c) => c.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="eyebrow">Admin</div>
        <h1 className="headline text-3xl mt-2">Restaurant claims</h1>
        <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-1">
          {claims.length} total · {pending.length} pending
        </p>
      </header>

      <section>
        <h2 className="section-heading">Pending ({pending.length})</h2>
        {pending.length === 0 && <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-3">No pending claims.</p>}
        <ul className="flex flex-col gap-3 mt-3">
          {pending.map((c) => (
            <li key={c.id} className="postcard p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg">{c.restaurant?.name ?? "(restaurant missing)"}</div>
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
                    {c.restaurant?.city} {c.restaurant && !c.restaurant.is_active ? "· (not yet listed publicly)" : ""}
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="eyebrow">Applicant</dt>
                    <dd>
                      {c.owner_full_name ?? "—"}
                      {c.profile?.username && (
                        <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2">@{c.profile.username}</span>
                      )}
                    </dd>
                    <dt className="eyebrow">Role</dt><dd>{c.role_at_restaurant ?? "—"}</dd>
                    <dt className="eyebrow">Phone</dt><dd className="font-mono">{c.contact_phone ?? "—"}</dd>
                    <dt className="eyebrow">Business</dt><dd>{c.business_legal_name ?? "—"}</dd>
                    <dt className="eyebrow">EIN</dt><dd className="font-mono">{c.ein ?? "—"}</dd>
                  </dl>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <form action={decideClaimAction.bind(null, c.id, "approved")}>
                    <button className="btn-primary py-1.5 px-3 text-[10px]">Approve</button>
                  </form>
                  <form action={decideClaimAction.bind(null, c.id, "rejected")}>
                    <button className="btn-ghost py-1.5 px-3 text-[10px]">Reject</button>
                  </form>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm font-serif">
                {c.verification_signed_url ? (
                  <a href={c.verification_signed_url} target="_blank" rel="noreferrer" className="text-[var(--pp-burgundy)] underline">
                    View proof document →
                  </a>
                ) : (
                  <span className="text-[var(--pp-ink-soft)] italic">No document uploaded</span>
                )}
                {c.business_legal_name && (
                  <a
                    href={`https://www.ark.org/corp-search/?search=${encodeURIComponent(c.business_legal_name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--pp-burgundy)] underline"
                  >
                    Check Arkansas SOS →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="section-heading">Decided</h2>
          <ul className="flex flex-col gap-1 text-sm mt-3">
            {decided.map((c) => (
              <li key={c.id} className="border border-[var(--pp-cream-dark)] rounded px-3 py-2 flex items-center justify-between">
                <span>
                  <span className="font-serif">{c.restaurant?.name ?? "(unknown)"}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--pp-ink-soft)]">@{c.profile?.username}</span>
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.2em] uppercase ${
                    c.status === "approved" ? "text-[var(--pp-forest)]" : "text-red-700"
                  }`}
                >
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
