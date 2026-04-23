import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleAdminAction, toggleSuspendAction, sendPasswordResetAction, deleteUserAction } from "./actions";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, points, followers_count, following_count, is_admin, is_restaurant_owner, is_suspended, suspended_reason, suspended_at, created_at")
    .eq("username", username)
    .maybeSingle();
  if (!user) notFound();

  const { count: stampCount }   = await supabase.from("checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { count: postCount }    = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { count: receiptCount } = await supabase.from("receipts").select("id", { count: "exact", head: true }).eq("user_id", user.id);

  const { data: owned } = await supabase
    .from("restaurant_owners")
    .select("restaurant_id, restaurants(slug, name)")
    .eq("user_id", user.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/users" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
          ← Users
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <div className="size-16 rounded-full bg-[var(--pp-cream)] overflow-hidden flex items-center justify-center text-2xl font-serif text-[var(--pp-burgundy)]">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              user.username.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-xl">{user.display_name ?? user.username}</div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
              @{user.username}
            </div>
            {user.bio && <p className="font-serif italic text-sm text-[var(--pp-ink-soft)] mt-1">{user.bio}</p>}
          </div>
          <Link href={`/u/${user.username}`} className="btn-ghost py-1.5 px-3 text-[10px]">
            View public
          </Link>
        </div>
      </header>

      {user.is_suspended && (
        <div className="postcard p-3 border-red-700 border-2">
          <div className="eyebrow text-red-700">Suspended</div>
          <div className="font-serif italic text-sm mt-1">
            {user.suspended_reason ?? "No reason given"}
            {user.suspended_at && <span className="text-[var(--pp-ink-soft)]"> · {new Date(user.suspended_at).toLocaleDateString()}</span>}
          </div>
        </div>
      )}

      {/* Activity */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Points"  value={user.points} />
        <Stat label="Stamps"  value={stampCount ?? 0} />
        <Stat label="Posts"   value={postCount ?? 0} />
        <Stat label="Receipts" value={receiptCount ?? 0} />
      </div>

      {/* Ownership */}
      {owned && owned.length > 0 && (
        <section>
          <h2 className="section-heading">Owns</h2>
          <ul className="flex flex-col gap-1 mt-2">
            {owned.map((o: any) => (
              <li key={o.restaurant_id}>
                <Link href={`/admin/restaurants/${o.restaurants?.slug}/edit`} className="font-serif text-[var(--pp-burgundy)]">
                  {o.restaurants?.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <section className="flex flex-col gap-2">
        <h2 className="section-heading">Actions</h2>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <form action={toggleAdminAction.bind(null, user.id, !user.is_admin)}>
            <button className="btn-ghost w-full py-2 px-3 text-[10px]">
              {user.is_admin ? "Revoke admin" : "Grant admin"}
            </button>
          </form>
          <form action={sendPasswordResetAction.bind(null, user.id)}>
            <button className="btn-ghost w-full py-2 px-3 text-[10px]">
              Email password reset
            </button>
          </form>
        </div>

        <form action={toggleSuspendAction.bind(null, user.id, !user.is_suspended)} className="flex gap-2 items-start">
          {!user.is_suspended && (
            <input name="reason" placeholder="Reason (visible to admins)" className="input flex-1 text-sm" />
          )}
          <button className={`${user.is_suspended ? "btn-ghost" : "btn-primary"} py-2 px-3 text-[10px]`}>
            {user.is_suspended ? "Unsuspend" : "Suspend"}
          </button>
        </form>

        <form action={deleteUserAction.bind(null, user.id)}>
          <button className="w-full py-2 px-3 rounded-full border border-red-700 text-red-700 font-mono text-[10px] tracking-[0.2em] uppercase">
            Delete account (permanent)
          </button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[var(--pp-cream-dark)] rounded-lg py-2">
      <div className="font-serif text-xl text-[var(--pp-burgundy)]">{value}</div>
      <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">{label}</div>
    </div>
  );
}
