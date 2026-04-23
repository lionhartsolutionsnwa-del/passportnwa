import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SearchBox from "./search-box";

export default async function CompanionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Who I follow
  const { data: iFollow } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);
  const iFollowIds = new Set((iFollow ?? []).map((r) => r.followee_id));

  // Who follows me
  const { data: followsMe } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("followee_id", user.id);
  const followsMeIds = new Set((followsMe ?? []).map((r) => r.follower_id));

  // Mutual = companions
  const companionIds = [...iFollowIds].filter((id) => followsMeIds.has(id));
  // Invites I've sent (I follow, they don't follow back)
  const sentIds = [...iFollowIds].filter((id) => !followsMeIds.has(id));
  // Invites for me (they follow me, I haven't added back)
  const incomingIds = [...followsMeIds].filter((id) => !iFollowIds.has(id));

  const allIds = Array.from(new Set([...companionIds, ...sentIds, ...incomingIds]));
  const { data: profiles } = allIds.length
    ? await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", allIds)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const companions = companionIds.map((id) => byId.get(id)).filter(Boolean);
  const sent       = sentIds.map((id) => byId.get(id)).filter(Boolean);
  const incoming   = incomingIds.map((id) => byId.get(id)).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="eyebrow">Companions</div>
        <h1 className="headline text-3xl mt-2">Travel together</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-1">
          Companions are mutual — both travelers must add each other.
        </p>
      </header>

      <SearchBox />

      {incoming.length > 0 && (
        <section>
          <h2 className="section-heading">Invitations · {incoming.length}</h2>
          <ul className="flex flex-col gap-1.5 mt-3">
            {incoming.map((p: any) => (
              <PersonRow key={p.id} p={p} badge="Wants to be companions" badgeGold />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-heading">Companions · {companions.length}</h2>
        {companions.length === 0 ? (
          <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-3">None yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 mt-3">
            {companions.map((p: any) => <PersonRow key={p.id} p={p} />)}
          </ul>
        )}
      </section>

      {sent.length > 0 && (
        <section>
          <h2 className="section-heading">Invitations sent · {sent.length}</h2>
          <ul className="flex flex-col gap-1.5 mt-3">
            {sent.map((p: any) => (
              <PersonRow key={p.id} p={p} badge="Pending" />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PersonRow({ p, badge, badgeGold }: { p: any; badge?: string; badgeGold?: boolean }) {
  return (
    <li>
      <Link href={`/u/${p.username}`} className="postcard flex items-center gap-3 px-3 py-2.5">
        <div className="size-11 rounded-full bg-[var(--pp-cream)] overflow-hidden flex items-center justify-center font-serif text-[var(--pp-burgundy)] shrink-0">
          {p.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            p.username.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif">{p.display_name ?? p.username}</div>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">@{p.username}</div>
        </div>
        {badge && (
          <span className={`postage shrink-0 ${badgeGold ? "border-[var(--pp-gold)] text-[var(--pp-gold)]" : ""}`}>
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}
