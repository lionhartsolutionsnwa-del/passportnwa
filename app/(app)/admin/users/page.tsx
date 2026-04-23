import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, points, is_admin, is_restaurant_owner, is_suspended, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  if (filter === "admins")     query = query.eq("is_admin", true);
  if (filter === "owners")     query = query.eq("is_restaurant_owner", true);
  if (filter === "suspended")  query = query.eq("is_suspended", true);

  const { data: users } = await query;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="headline text-3xl">Users</h1>

      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search username or name…" className="input flex-1" />
        {filter && <input type="hidden" name="filter" value={filter} />}
        <button className="btn-primary py-2 px-4 text-[11px]">Go</button>
      </form>

      <div className="flex gap-1">
        <FilterLink href="/admin/users" label="All" active={!filter} />
        <FilterLink href="/admin/users?filter=admins" label="Admins" active={filter === "admins"} />
        <FilterLink href="/admin/users?filter=owners" label="Owners" active={filter === "owners"} />
        <FilterLink href="/admin/users?filter=suspended" label="Suspended" active={filter === "suspended"} />
      </div>

      <ul className="flex flex-col gap-1.5">
        {users?.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/users/${u.username}`} className="postcard flex items-center gap-3 px-3 py-2.5">
              <div className="size-10 rounded-full bg-[var(--pp-cream)] overflow-hidden flex items-center justify-center font-serif text-[var(--pp-burgundy)] shrink-0">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  u.username.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif">{u.display_name ?? u.username}</div>
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
                  @{u.username} · {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {u.is_admin     && <span className="postage">Admin</span>}
                {u.is_restaurant_owner && <span className="postage">Owner</span>}
                {u.is_suspended && <span className="postage text-red-700 border-red-700">Suspended</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.15em] uppercase ${
        active ? "bg-[var(--pp-burgundy)] text-[var(--pp-cream)]" : "text-[var(--pp-ink-soft)]"
      }`}
    >
      {label}
    </Link>
  );
}
