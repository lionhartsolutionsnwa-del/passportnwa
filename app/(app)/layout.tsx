import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteFooter from "@/components/site-footer";
import NotificationsBell from "@/components/notifications-bell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, points, is_admin, is_restaurant_owner, is_suspended, suspended_reason, onboarded_at, avatar_url, display_name")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarded_at && profile.username) {
    redirect("/welcome");
  }

  if (profile?.is_suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center flex flex-col items-center gap-4">
          <div className="eyebrow text-red-700">Account suspended</div>
          <h1 className="headline text-3xl">Access paused</h1>
          <p className="font-serif italic text-[var(--pp-ink-soft)]">
            {profile.suspended_reason ?? "Your account has been suspended. Contact hello@passportnwa.com if this is an error."}
          </p>
          <form action="/auth/signout" method="POST">
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const { count: ownedCount } = await supabase
    .from("restaurant_owners")
    .select("restaurant_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const showDashboard = (ownedCount ?? 0) > 0;
  const profileHref = profile?.username ? `/u/${profile.username}` : "/settings";

  const navItems = [
    { href: "/", label: "Journal", icon: "◴" },
    { href: "/restaurants", label: "Atlas", icon: "✦" },
    { href: profileHref, label: "Passport", icon: "✺" },
    { href: "/companions", label: "Companions", icon: "❍" },
    ...(showDashboard ? [{ href: "/dashboard", label: "Concierge", icon: "❖", gold: true }] : []),
    ...(profile?.is_admin ? [{ href: "/admin", label: "Admin", icon: "✦" }] : []),
  ];

  return (
    <div className="min-h-screen lg:flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:px-5 lg:py-6 lg:border-r lg:border-[var(--pp-cream-dark)] lg:bg-[var(--pp-paper)]/90 lg:backdrop-blur lg:z-30">
        <Link href="/" className="flex items-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Passport NWA" className="size-12 rounded-full" />
          <div className="leading-tight">
            <div className="font-serif text-xl text-[var(--pp-burgundy)] tracking-tight">Passport</div>
            <div className="font-mono text-[9px] tracking-[0.35em] text-[var(--pp-ink-soft)] uppercase -mt-0.5">Northwest Arkansas</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink key={item.href + item.label} {...item} />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href={profileHref}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--pp-cream)] transition-colors"
          >
            <div className="size-10 rounded-full overflow-hidden bg-[var(--pp-cream)] ring-1 ring-[var(--pp-cream-dark)] flex items-center justify-center font-serif text-[var(--pp-burgundy)]">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                (profile?.display_name ?? profile?.username ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-serif text-sm text-[var(--pp-ink)] truncate leading-tight">
                {profile?.display_name ?? profile?.username}
              </div>
              <div className="font-mono text-[10px] text-[var(--pp-ink-soft)] truncate">
                <span className="text-[var(--pp-gold)]">★</span> {profile?.points ?? 0} pts
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex flex-col flex-1 min-h-screen lg:pl-64">
        {/* MOBILE HEADER (hidden on desktop) */}
        <header className="lg:hidden sticky top-0 z-20 bg-[var(--pp-paper)]/90 backdrop-blur border-b border-[var(--pp-cream-dark)]">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Passport NWA" className="size-9 rounded-full shrink-0" />
              <div className="leading-tight min-w-0">
                <div className="font-serif text-[17px] text-[var(--pp-burgundy)] tracking-tight">Passport</div>
                <div className="font-mono text-[9px] tracking-[0.35em] text-[var(--pp-ink-soft)] uppercase -mt-0.5 truncate">NORTHWEST AR</div>
              </div>
            </Link>
            <div className="flex items-center gap-2.5">
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="font-mono text-[10px] tracking-[0.18em] uppercase px-2.5 py-1.5 rounded border border-[var(--pp-burgundy)] text-[var(--pp-burgundy)]"
                >
                  Admin
                </Link>
              )}
              <NotificationsBell />
              <span className="font-mono text-sm text-[var(--pp-burgundy)] tabular-nums">
                <span className="text-[var(--pp-gold)]">★</span> {profile?.points ?? 0}
              </span>
            </div>
          </div>
        </header>

        {/* DESKTOP TOP STRIP — quick actions on desktop */}
        <div className="hidden lg:flex sticky top-0 z-20 bg-[var(--pp-paper)]/90 backdrop-blur border-b border-[var(--pp-cream-dark)] h-16 items-center justify-end px-8 gap-4">
          <NotificationsBell />
        </div>

        {/* BETA BANNER */}
        <div className="max-w-3xl mx-auto w-full px-5 lg:px-8 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 border-l-4 border-[var(--pp-gold)] bg-[var(--pp-cream)]/50 rounded-r">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 rounded border border-[var(--pp-burgundy)] text-[var(--pp-burgundy)] font-bold">
              Beta
            </span>
            <p className="font-serif italic text-xs text-[var(--pp-ink-soft)] leading-tight flex-1">
              Passport NWA is in active development. Send feedback to{" "}
              <a href="mailto:hello@passportnwa.com" className="text-[var(--pp-burgundy)] underline">hello@passportnwa.com</a>.
            </p>
          </div>
        </div>

        <main className="flex-1 max-w-3xl mx-auto w-full px-5 lg:px-8 py-6 pb-4">{children}</main>

        <SiteFooter />

        {/* Bottom padding so mobile content doesn't hide under bottom nav */}
        <div className="lg:hidden pb-24" />
      </div>

      {/* MOBILE BOTTOM NAV (hidden on desktop) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-[var(--pp-paper)]/95 backdrop-blur border-t border-[var(--pp-cream-dark)]">
        <div className={`max-w-2xl mx-auto grid ${showDashboard ? "grid-cols-4" : "grid-cols-3"} text-center`}>
          <BottomNavItem href="/" label="Journal" icon="◴" />
          <BottomNavItem href="/restaurants" label="Atlas" icon="✦" />
          <BottomNavItem href={profileHref} label="Passport" icon="✺" />
          {showDashboard && <BottomNavItem href="/dashboard" label="Concierge" icon="❖" gold />}
        </div>
      </nav>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  gold,
}: {
  href: string;
  label: string;
  icon: string;
  gold?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--pp-cream)] ${
        gold ? "text-[var(--pp-gold)]" : "text-[var(--pp-ink)]"
      }`}
    >
      <span className={`text-lg leading-none w-6 text-center ${gold ? "text-[var(--pp-gold)]" : "text-[var(--pp-burgundy)]"}`}>
        {icon}
      </span>
      <span className="font-mono text-[11px] tracking-[0.25em] uppercase">{label}</span>
    </Link>
  );
}

function BottomNavItem({
  href,
  label,
  icon,
  gold,
}: {
  href: string;
  label: string;
  icon: string;
  gold?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`py-3 flex flex-col items-center gap-1 ${
        gold ? "text-[var(--pp-gold)]" : "text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]"
      }`}
    >
      <span className={`text-xl leading-none ${gold ? "" : "text-[var(--pp-burgundy)]"}`}>{icon}</span>
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{label}</span>
    </Link>
  );
}
