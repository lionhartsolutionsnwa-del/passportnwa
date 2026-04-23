import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decideClaimAction } from "./actions";

export default async function ClaimsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: claims } = await supabase
    .from("restaurant_claims")
    .select(
      "id, status, role_at_restaurant, contact_phone, message, owner_full_name, business_legal_name, ein, verification_doc_path, created_at, profiles(username, display_name), restaurants(id, name, city, is_active)",
    )
    .order("created_at", { ascending: false });

  // Sign verification doc URLs (private bucket)
  const withSigned = await Promise.all(
    (claims ?? []).map(async (c: any) => {
      if (!c.verification_doc_path) return c;
      const { data } = await admin.storage
        .from("verification")
        .createSignedUrl(c.verification_doc_path, 3600);
      return { ...c, verification_signed_url: data?.signedUrl ?? null };
    }),
  );

  const pending = withSigned.filter((c: any) => c.status === "pending");
  const decided = withSigned.filter((c: any) => c.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="eyebrow">Admin</div>
        <h1 className="headline text-3xl mt-2">Restaurant claims</h1>
      </header>

      <section>
        <h2 className="section-heading">Pending ({pending.length})</h2>
        {pending.length === 0 && <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-3">No pending claims.</p>}
        <ul className="flex flex-col gap-3 mt-3">
          {pending.map((c: any) => (
            <li key={c.id} className="postcard p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg">{c.restaurants?.name}</div>
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
                    {c.restaurants?.city} {c.restaurants?.is_active ? "" : "· (not yet listed publicly)"}
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="eyebrow">Applicant</dt>
                    <dd>
                      {c.owner_full_name}
                      <span className="font-mono text-[10px] text-[var(--pp-ink-soft)] ml-2">@{c.profiles?.username}</span>
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
                <a
                  href={`https://www.ark.org/corp-search/?search=${encodeURIComponent(c.business_legal_name ?? "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--pp-burgundy)] underline"
                >
                  Check Arkansas SOS →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="section-heading">Decided</h2>
          <ul className="flex flex-col gap-1 text-sm mt-3">
            {decided.map((c: any) => (
              <li key={c.id} className="border border-[var(--pp-cream-dark)] rounded px-3 py-2 flex items-center justify-between">
                <span>
                  <span className="font-serif">{c.restaurants?.name}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--pp-ink-soft)]">@{c.profiles?.username}</span>
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
