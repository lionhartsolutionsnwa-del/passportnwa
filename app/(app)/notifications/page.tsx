import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllReadAction, dismissNotificationAction } from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link_url, created_at, read_at, dismissed_at, restaurants:related_restaurant_id(slug, name, city)")
    .eq("user_id", user.id)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const unread = (notifications ?? []).filter((n) => !n.read_at);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="eyebrow">Inbox</div>
          <h1 className="headline text-3xl mt-1">Notifications</h1>
        </div>
        {unread.length > 0 && (
          <form action={markAllReadAction}>
            <button className="btn-ghost py-1.5 px-3 text-[10px]">Mark all read</button>
          </form>
        )}
      </header>

      {(!notifications || notifications.length === 0) && (
        <div className="postcard p-8 text-center">
          <p className="font-serif italic text-[var(--pp-ink-soft)]">
            No notifications yet. Stamp a passport, invite a companion — things will land here.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {notifications?.map((n: any) => {
          const unreadDot = !n.read_at;
          const href = n.link_url ?? (n.restaurants?.slug ? `/r/${n.restaurants.slug}` : "/");
          return (
            <li key={n.id}>
              <div className={`postcard p-4 ${unreadDot ? "border-l-4 border-[var(--pp-burgundy)]" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <Link href={href} className="flex-1 min-w-0 block">
                    <div className="font-serif text-[var(--pp-ink)]">{n.title}</div>
                    {n.body && (
                      <p className="font-serif italic text-sm text-[var(--pp-ink-soft)] mt-1">{n.body}</p>
                    )}
                    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </Link>
                  <form action={dismissNotificationAction.bind(null, n.id)}>
                    <button className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
