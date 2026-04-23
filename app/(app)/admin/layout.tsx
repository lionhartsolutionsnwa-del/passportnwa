import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="eyebrow text-[var(--pp-burgundy)]">Admin</div>
        <nav className="flex gap-3 mt-2 border-b border-[var(--pp-cream-dark)] pb-3 overflow-x-auto scrollbar-none">
          {[
            ["/admin", "Home"],
            ["/admin/claims", "Claims"],
            ["/admin/restaurants", "Restaurants"],
            ["/admin/users", "Users"],
            ["/admin/posts", "Posts"],
            ["/admin/receipts", "Receipts"],
            ["/admin/announcements", "Broadcast"],
            ["/admin/stats", "Stats"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)] whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
