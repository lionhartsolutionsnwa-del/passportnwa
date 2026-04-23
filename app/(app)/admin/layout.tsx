import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-[var(--accent)]">Admin</div>
        <nav className="flex gap-4 mt-2 text-sm border-b border-white/10 pb-3">
          <Link href="/admin/restaurants/new" className="hover:text-white text-white/70">Add restaurant</Link>
          <Link href="/admin/claims" className="hover:text-white text-white/70">Claims</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
