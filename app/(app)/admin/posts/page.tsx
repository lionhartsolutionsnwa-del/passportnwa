import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deletePostAction } from "./actions";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, caption, photo_url, created_at, profiles(username, display_name), restaurants(slug, name, city)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="headline text-3xl">Posts (latest 100)</h1>

      <ul className="flex flex-col gap-3">
        {posts?.map((p: any) => (
          <li key={p.id} className="postcard p-3 flex gap-3">
            {p.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo_url} alt="" className="size-20 object-cover rounded shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)]">
                <Link href={`/admin/users/${p.profiles?.username}`} className="text-[var(--pp-burgundy)]">@{p.profiles?.username}</Link>
                {" · "}
                {p.restaurants && (
                  <Link href={`/admin/restaurants/${p.restaurants.slug}/edit`} className="text-[var(--pp-burgundy)]">{p.restaurants.name}</Link>
                )}
                {" · "}{new Date(p.created_at).toLocaleString()}
              </div>
              {p.caption && <p className="font-serif mt-1">{p.caption}</p>}
            </div>
            <form action={deletePostAction.bind(null, p.id)} className="shrink-0">
              <button className="font-mono text-[10px] tracking-[0.2em] uppercase text-red-700 px-2 py-1 border border-red-700/40 rounded">
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
