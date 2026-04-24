import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsBell() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)
    .is("dismissed_at", null);

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative inline-flex items-center justify-center size-8 rounded-full hover:bg-[var(--pp-cream)]"
    >
      <span className="text-lg text-[var(--pp-burgundy)]">✉</span>
      {count ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--pp-burgundy)] text-[var(--pp-cream)] text-[9px] font-mono font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
