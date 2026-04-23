import { createClient } from "@/lib/supabase/server";
import { createAnnouncementAction, toggleAnnouncementAction, deleteAnnouncementAction } from "./actions";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, message, link_url, link_label, is_active, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="headline text-3xl">Broadcast banner</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm mt-1">
          Active messages appear above the Journal feed for all travelers.
        </p>
      </div>

      <form action={createAnnouncementAction} className="postcard p-4 flex flex-col gap-2">
        <div className="eyebrow">New announcement</div>
        <textarea
          name="message"
          required
          rows={2}
          placeholder="Welcome to Passport NWA. We're launching with 47 restaurants across the 479."
          className="input resize-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input name="link_url"   placeholder="Link URL (optional)" className="input text-sm" />
          <input name="link_label" placeholder="Link label (optional)" className="input text-sm" />
        </div>
        <input name="ends_at" type="datetime-local" className="input text-sm" />
        <button className="btn-primary py-2.5 px-4 text-[11px] self-start">Post announcement</button>
      </form>

      <ul className="flex flex-col gap-2">
        {!announcements?.length && (
          <li className="font-serif italic text-[var(--pp-ink-soft)] text-sm">No announcements yet.</li>
        )}
        {announcements?.map((a) => (
          <li key={a.id} className="postcard p-3">
            <div className="flex items-start justify-between gap-3">
              <div className={a.is_active ? "" : "opacity-50"}>
                <div className="font-serif">{a.message}</div>
                {a.link_url && (
                  <div className="font-mono text-[10px] text-[var(--pp-burgundy)] mt-1 truncate">
                    → {a.link_label ?? a.link_url}
                  </div>
                )}
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-2">
                  {new Date(a.starts_at).toLocaleString()}
                  {a.ends_at ? ` → ${new Date(a.ends_at).toLocaleString()}` : ""}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <form action={toggleAnnouncementAction.bind(null, a.id, !a.is_active)}>
                  <button className="font-mono text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded border border-[var(--pp-cream-dark)]">
                    {a.is_active ? "Pause" : "Activate"}
                  </button>
                </form>
                <form action={deleteAnnouncementAction.bind(null, a.id)}>
                  <button className="font-mono text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded border border-red-700/40 text-red-700">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
