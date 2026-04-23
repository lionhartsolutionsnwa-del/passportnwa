import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type FeedRow = {
  id: string;
  caption: string | null;
  photo_url: string | null;
  created_at: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
  restaurants: { slug: string; name: string; city: string } | null;
  post_tags: { profiles: { username: string } | null }[] | null;
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const tab: "all" | "following" = view === "following" ? "following" : "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select(
      "id, caption, photo_url, created_at, profiles(username, display_name, avatar_url), restaurants(slug, name, city), post_tags(profiles(username))",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (tab === "following" && user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", user.id);
    const ids = (follows ?? []).map((f) => f.followee_id);
    if (ids.length === 0) return <EmptyFollowing />;
    query = query.in("user_id", ids);
  }

  const { data } = await query;
  const posts = (data ?? []) as unknown as FeedRow[];

  // Active announcements (admin-controlled banner)
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, message, link_url, link_label")
    .order("starts_at", { ascending: false })
    .limit(3);

  // Featured restaurants
  const { data: featured } = await supabase
    .from("restaurants")
    .select("slug, name, city, cuisine, cover_image_url")
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(6);

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <div className="eyebrow">{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
        <h1 className="headline text-4xl mt-2">Passport NWA</h1>
        <div className="fleuron mt-4">⌑</div>
      </header>

      {announcements && announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          {announcements.map((a) => (
            <div key={a.id} className="border-l-4 border-[var(--pp-burgundy)] bg-[var(--pp-cream)]/50 pl-4 py-3 pr-4">
              <p className="font-serif text-[var(--pp-ink)]">{a.message}</p>
              {a.link_url && (
                <Link
                  href={a.link_url}
                  className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-burgundy)] mt-1 inline-block"
                >
                  {a.link_label ?? "Read more"} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {featured && featured.length > 0 && (
        <section>
          <h2 className="section-heading">Featured this week</h2>
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 mt-3 scrollbar-none">
            {featured.map((r) => (
              <Link key={r.slug} href={`/r/${r.slug}`} className="postcard shrink-0 w-40">
                <div className="h-24 overflow-hidden bg-[var(--pp-cream)]">
                  {r.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover_image_url} alt="" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="p-2.5">
                  <div className="font-serif text-sm leading-tight line-clamp-1">{r.name}</div>
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] mt-1 truncate">
                    {r.city}{r.cuisine ? ` · ${r.cuisine}` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <TabLink active={tab === "all"} href="/">All travelers</TabLink>
          <TabLink active={tab === "following"} href="/?view=following">Following</TabLink>
        </div>
        <Link href="/restaurants" className="btn-ghost text-[10px]">
          Check in
        </Link>
      </div>

      {posts.length === 0 && (
        <div className="postcard p-10 text-center">
          <div className="eyebrow">No entries yet</div>
          <p className="font-serif italic text-[var(--pp-ink-soft)] mt-3 text-lg">
            "The journey begins with a single stamp."
          </p>
          <Link href="/restaurants" className="btn-primary mt-6">
            Begin →
          </Link>
        </div>
      )}

      {posts.map((p) => (
        <article key={p.id} className="postcard">
          <header className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="size-10 rounded-full overflow-hidden bg-[var(--pp-cream)] ring-1 ring-[var(--pp-cream-dark)] flex items-center justify-center font-serif text-[var(--pp-burgundy)]">
              {p.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.profiles.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                (p.profiles?.username ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/u/${p.profiles?.username ?? ""}`} className="font-serif text-[var(--pp-ink)] hover:text-[var(--pp-burgundy)]">
                {p.profiles?.display_name ?? `@${p.profiles?.username}`}
              </Link>
              {p.restaurants && (
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
                  Reporting from{" "}
                  <Link href={`/r/${p.restaurants.slug}`} className="text-[var(--pp-burgundy)] hover:underline">
                    {p.restaurants.name}
                  </Link>
                  {" · "}{p.restaurants.city}
                </div>
              )}
            </div>
            <time className="font-mono text-[10px] text-[var(--pp-ink-soft)] shrink-0">{timeAgo(p.created_at)}</time>
          </header>
          {p.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo_url} alt="" className="w-full max-h-[520px] object-cover border-y border-[var(--pp-cream-dark)]" />
          )}
          {p.caption && (
            <p className="px-5 py-4 font-serif text-[var(--pp-ink)] leading-relaxed whitespace-pre-wrap">
              {renderCaption(p.caption)}
            </p>
          )}
          {p.post_tags && p.post_tags.length > 0 && (
            <div className="px-5 pb-4 font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
              traveling with{" "}
              {p.post_tags
                .map((t, i) =>
                  t.profiles ? (
                    <Link key={i} href={`/u/${t.profiles.username}`} className="text-[var(--pp-burgundy)] hover:underline">
                      @{t.profiles.username}
                    </Link>
                  ) : null,
                )
                .filter(Boolean)
                .reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ", ", el]), [])}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function TabLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase rounded ${
        active
          ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)]"
          : "text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyFollowing() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        <TabLink active={false} href="/">All travelers</TabLink>
        <TabLink active={true} href="/?view=following">Following</TabLink>
      </div>
      <div className="postcard p-10 text-center">
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-lg">
          "Follow other travelers to see their journals here."
        </p>
        <Link href="/" className="btn-ghost mt-6">All travelers</Link>
      </div>
    </div>
  );
}

function renderCaption(caption: string): React.ReactNode {
  const parts = caption.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const username = part.slice(1);
      return (
        <Link key={i} href={`/u/${username}`} className="text-[var(--pp-burgundy)] hover:underline font-medium">
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
