import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { followAction, unfollowAction } from "./actions";

function tier(spotsVisited: number) {
  if (spotsVisited >= 25) return { name: "NWA Legend", code: "L-3" };
  if (spotsVisited >= 10) return { name: "Local",      code: "L-2" };
  if (spotsVisited >= 3)  return { name: "Regular",    code: "L-1" };
  return { name: "Explorer", code: "L-0" };
}

function fmtIssued(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
}

function tilt(seed: string) {
  // Deterministic tilt based on id, range -8 to +8 degrees
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (h % 17) - 8;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, points, followers_count, following_count, favorite_restaurant_ids, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isMe = user?.id === profile.id;

  let isFollowing = false;
  if (user && !isMe) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("followee_id", profile.id)
      .maybeSingle();
    isFollowing = !!data;
  }

  const { data: stamps } = await supabase
    .from("checkins")
    .select("id, created_at, restaurants(slug, name, city)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const uniqueRestaurants = new Set(
    (stamps ?? []).map((s: any) => s.restaurants?.slug).filter(Boolean),
  ).size;

  // Mutual-follow friends
  const { data: theyFollow } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", profile.id);
  const theyFollowIds = (theyFollow ?? []).map((r) => r.followee_id);
  let friends: { username: string; display_name: string | null; avatar_url: string | null }[] = [];
  if (theyFollowIds.length) {
    const { data: mutual } = await supabase
      .from("follows")
      .select("follower_id, profiles!follows_follower_id_fkey(username, display_name, avatar_url)")
      .eq("followee_id", profile.id)
      .in("follower_id", theyFollowIds);
    friends = (mutual ?? []).map((m: any) => m.profiles).filter(Boolean);
  }

  const favIds = (profile.favorite_restaurant_ids ?? []) as string[];
  let favorites: { id: string; slug: string; name: string; city: string; cover_image_url: string | null }[] = [];
  if (favIds.length) {
    const { data: favs } = await supabase
      .from("restaurants")
      .select("id, slug, name, city, cover_image_url")
      .in("id", favIds);
    const byId = new Map((favs ?? []).map((r: any) => [r.id, r]));
    favorites = favIds.map((id) => byId.get(id)).filter(Boolean) as any[];
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, photo_url, caption, created_at, restaurants(slug, name)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(24);

  const t = tier(uniqueRestaurants);
  const passportNo = profile.id.replace(/-/g, "").slice(0, 9).toUpperCase();

  return (
    <div className="passport-page -mx-4 -my-6 px-0 pb-32">
      {/* COVER */}
      <section className="passport-cover px-6 pt-7 pb-10 mx-4 mt-2 rounded-2xl">
        <div className="flex justify-between items-start">
          <div className="text-[10px] tracking-[0.4em] font-serif foil">
            PASSPORT NWA
          </div>
          <div className="text-[10px] tracking-[0.3em] font-mono text-[var(--pp-cream)]/60">
            NORTHWEST ARKANSAS · USA
          </div>
        </div>

        <div className="mt-6 flex items-center gap-5">
          <div className="size-24 rounded-full overflow-hidden ring-2 ring-[var(--pp-gold)]/60 ring-offset-2 ring-offset-[var(--pp-burgundy)] bg-[var(--pp-burgundy-deep)] flex items-center justify-center text-3xl font-serif">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <span className="foil">{(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.3em] text-[var(--pp-gold)]/80 font-mono">SURNAME / GIVEN NAMES</div>
            <div className="font-serif text-2xl leading-tight foil truncate">
              {profile.display_name ?? profile.username}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
              <Field label="Passport No." value={passportNo} />
              <Field label="Issued" value={fmtIssued(profile.created_at)} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="crest">{t.name}</span>
          <div className="text-right font-mono text-[var(--pp-cream)]/80">
            <div className="text-[9px] tracking-[0.3em] opacity-60">HANDLE</div>
            <div className="text-sm">@{profile.username}</div>
          </div>
        </div>
      </section>

      {/* ACTION BAR */}
      <div className="px-6 mt-5 flex justify-end gap-2">
        {isMe ? (
          <>
            <Link
              href="/settings"
              className="text-xs px-3 py-2 rounded-md border border-[var(--pp-burgundy)]/30 text-[var(--pp-burgundy)] hover:bg-[var(--pp-burgundy)]/5 font-mono tracking-widest uppercase"
            >
              Edit
            </Link>
            <form action="/auth/signout" method="POST">
              <button className="text-xs px-3 py-2 rounded-md border border-[var(--pp-burgundy)]/30 text-[var(--pp-burgundy)] hover:bg-[var(--pp-burgundy)]/5 font-mono tracking-widest uppercase">
                Sign out
              </button>
            </form>
          </>
        ) : isFollowing ? (
          <form action={unfollowAction.bind(null, profile.id, profile.username)}>
            <button className="text-xs px-4 py-2 rounded-md border border-[var(--pp-burgundy)]/40 text-[var(--pp-burgundy)] font-mono tracking-widest uppercase">
              Following
            </button>
          </form>
        ) : (
          <form action={followAction.bind(null, profile.id, profile.username)}>
            <button className="text-xs px-4 py-2 rounded-md bg-[var(--pp-burgundy)] text-[var(--pp-cream)] font-mono tracking-widest uppercase">
              Follow
            </button>
          </form>
        )}
      </div>

      {/* BIO */}
      {profile.bio && (
        <p className="mt-4 mx-6 font-serif italic text-[var(--pp-ink)]/80 text-center">
          "{profile.bio}"
        </p>
      )}

      {/* STATS — embossed seals */}
      <div className="mx-6 mt-6 grid grid-cols-3 gap-3">
        <Seal label="Points"  value={profile.points} />
        <Seal label="Stamps"  value={stamps?.length ?? 0} />
        <Seal label="Spots"   value={uniqueRestaurants} />
      </div>

      {/* FAVORITES */}
      {favorites.length > 0 && (
        <Section title="Top Destinations">
          <div className="grid grid-cols-3 gap-3 mt-3">
            {favorites.map((f, i) => (
              <Link
                key={f.id}
                href={`/r/${f.slug}`}
                className="relative rounded-lg overflow-hidden aspect-square border border-[var(--pp-burgundy)]/20 shadow-[0_2px_4px_rgba(91,31,41,0.1)]"
              >
                {f.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.cover_image_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-[var(--pp-burgundy)]/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--pp-burgundy-deep)]/95 via-transparent to-transparent p-2 flex flex-col justify-end text-[var(--pp-cream)]">
                  <div className="font-mono text-[8px] tracking-[0.3em] text-[var(--pp-gold)]">№ {String(i + 1).padStart(2, "0")}</div>
                  <div className="font-serif text-xs leading-tight line-clamp-2">{f.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* FRIENDS */}
      <Section title={`Companions · ${friends.length}`}>
        {friends.length === 0 ? (
          <p className="font-serif italic text-[var(--pp-ink)]/50 mt-3 text-sm">
            No companions yet. Friendships form when two travelers follow each other.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto -mx-6 px-6 mt-3 scrollbar-none">
            {friends.map((f) => (
              <Link key={f.username} href={`/u/${f.username}`} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                <div className="size-14 rounded-full overflow-hidden bg-[var(--pp-burgundy)]/10 ring-1 ring-[var(--pp-burgundy)]/20 flex items-center justify-center font-serif text-lg text-[var(--pp-burgundy)]">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt="" className="size-full object-cover" />
                  ) : (
                    f.username.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="text-[10px] truncate w-full text-center font-mono text-[var(--pp-ink)]/70">@{f.username}</div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* STAMPS */}
      <Section title="Visa Stamps">
        {!stamps?.length ? (
          <p className="font-serif italic text-[var(--pp-ink)]/50 mt-3 text-sm">
            No stamps yet. <Link href="/restaurants" className="underline text-[var(--pp-burgundy)]">Begin your travels →</Link>
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3 justify-start">
            {stamps.map((s: any) => (
              <Link
                key={s.id}
                href={`/r/${s.restaurants?.slug}`}
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
      </Section>

      {/* POSTS */}
      <Section title="Field Notes">
        {!posts?.length ? (
          <p className="font-serif italic text-[var(--pp-ink)]/50 mt-3 text-sm">No entries yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-3">
            {posts.map((p: any) => (
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
      </Section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono tracking-[0.25em] text-[var(--pp-gold)]/70">{label}</div>
      <div className="font-mono text-[var(--pp-cream)] text-sm tracking-wider">{value}</div>
    </div>
  );
}

function Seal({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-3 px-2 border border-[var(--pp-burgundy)]/25 rounded-lg bg-white/30 backdrop-blur-sm shadow-inner">
      <div className="font-serif text-2xl text-[var(--pp-burgundy)] font-semibold">{value}</div>
      <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[var(--pp-burgundy)]/70 mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-6 mt-8">
      <h2 className="section-heading">{title}</h2>
      {children}
    </section>
  );
}
