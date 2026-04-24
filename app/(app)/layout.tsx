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
    .select("username, points, is_admin, is_restaurant_owner, is_suspended, suspended_reason")
    .eq("id", user.id)
    .single();

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[var(--pp-paper)]/85 backdrop-blur border-b border-[var(--pp-cream-dark)]">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Passport NWA" className="size-8 rounded-full" />
            <div className="leading-tight">
              <div className="font-serif text-[15px] text-[var(--pp-burgundy)] tracking-tight">Passport</div>
              <div className="font-mono text-[8px] tracking-[0.4em] text-[var(--pp-ink-soft)] uppercase -mt-0.5">Northwest Arkansas</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded border border-[var(--pp-burgundy)] text-[var(--pp-burgundy)]"
              >
                Admin
              </Link>
            )}
            <NotificationsBell />
            <span className="font-mono text-xs text-[var(--pp-burgundy)]">
              <span className="text-[var(--pp-gold)]">★</span> {profile?.points ?? 0}
            </span>
            <Link href={profileHref} className="font-mono text-xs text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
              @{profile?.username ?? "me"}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-5 pt-2">
        <div className="flex items-center gap-2 px-3 py-2 border-l-4 border-[var(--pp-gold)] bg-[var(--pp-cream)]/50 rounded-r">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded border border-[var(--pp-burgundy)] text-[var(--pp-burgundy)] font-bold">
            Beta
          </span>
          <p className="font-serif italic text-xs text-[var(--pp-ink-soft)] leading-tight flex-1">
            Passport NWA is in active development. Send feedback to{" "}
            <a href="mailto:hello@passportnwa.com" className="text-[var(--pp-burgundy)] underline">hello@passportnwa.com</a>.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-6 pb-4">{children}</main>

      <SiteFooter />

      <div className="pb-24" />

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--pp-paper)]/95 backdrop-blur border-t border-[var(--pp-cream-dark)]">
        <div
          className={`max-w-2xl mx-auto grid ${showDashboard ? "grid-cols-4" : "grid-cols-3"} text-center`}
        >
          <NavItem href="/" label="Journal" icon="◴" />
          <NavItem href="/restaurants" label="Atlas" icon="✦" />
          <NavItem href={profileHref} label="Passport" icon="✺" />
          {showDashboard && <NavItem href="/dashboard" label="Concierge" icon="❖" gold />}
        </div>
      </nav>
    </div>
  );
}

function NavItem({
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
      className={`py-2.5 flex flex-col items-center gap-0.5 ${
        gold ? "text-[var(--pp-gold)]" : "text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]"
      }`}
    >
      <span className={`text-base leading-none ${gold ? "" : "text-[var(--pp-burgundy)]"}`}>{icon}</span>
      <span className="font-mono text-[9px] tracking-[0.25em] uppercase">{label}</span>
    </Link>
  );
}
