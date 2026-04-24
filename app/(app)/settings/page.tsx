import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfileAction } from "./actions";
import FavoritePicker from "./favorite-picker";
import ReferralCard from "./referral-card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, phone, email_marketing_consent, sms_marketing_consent, favorite_restaurant_ids")
    .eq("id", user.id)
    .maybeSingle();

  const favIds = (profile?.favorite_restaurant_ids ?? []) as string[];
  const { data: favRestaurants } = favIds.length
    ? await supabase.from("restaurants").select("id, name, city").in("id", favIds)
    : { data: [] };

  const { count: referredCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)] hover:text-[var(--pp-burgundy)]">
        ← Journal
      </Link>
      <header>
        <div className="eyebrow">Application for Travel</div>
        <h1 className="headline text-3xl mt-2">Edit Passport</h1>
      </header>

      <form action={saveProfileAction} className="flex flex-col gap-5">
        <div className="postcard p-5">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-[var(--pp-cream)] ring-1 ring-[var(--pp-cream-dark)] overflow-hidden flex items-center justify-center text-2xl font-serif text-[var(--pp-burgundy)]">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                (profile?.display_name ?? profile?.username ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <label className="eyebrow">Portrait</label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
                className="block mt-1 text-xs font-mono file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border file:border-[var(--pp-burgundy)] file:bg-transparent file:text-[var(--pp-burgundy)] file:font-mono file:text-[10px] file:tracking-[0.2em] file:uppercase"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="eyebrow">Surname / Given names</label>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Your name"
            className="input mt-2"
          />
        </div>

        <div>
          <label className="eyebrow">Handle</label>
          <div className="mt-2 flex items-center input p-0">
            <span className="px-3 font-mono text-[var(--pp-ink-soft)]">@</span>
            <input
              name="username"
              defaultValue={profile?.username ?? ""}
              required
              pattern="[a-zA-Z0-9_]{3,30}"
              title="3-30 letters, numbers, or underscores"
              className="flex-1 py-3 pr-3 bg-transparent outline-none font-mono"
            />
          </div>
          <p className="font-mono text-[10px] text-[var(--pp-ink-soft)] mt-1.5">3-30 letters, numbers, or underscores.</p>
        </div>

        <div>
          <label className="eyebrow">Travel motto</label>
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            rows={3}
            placeholder="A line about you"
            className="input mt-2 font-serif italic resize-none"
          />
        </div>

        <div>
          <label className="eyebrow">Phone</label>
          <input
            name="phone"
            type="tel"
            required
            defaultValue={profile?.phone ?? ""}
            placeholder="(479) 555-0100"
            className="input mt-2"
          />
          <p className="font-mono text-[10px] text-[var(--pp-ink-soft)] mt-1">
            Used for account security and service messages. Marketing texts are separate (below).
          </p>
        </div>

        <div className="postcard p-4 flex flex-col gap-3">
          <div className="eyebrow">Communications</div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="email_marketing_consent"
              defaultChecked={!!profile?.email_marketing_consent}
              className="mt-0.5"
            />
            <span className="font-serif text-sm">
              Marketing emails — new restaurants, featured perks, platform news. Unsubscribe anytime.
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="sms_marketing_consent"
              defaultChecked={!!profile?.sms_marketing_consent}
              className="mt-0.5"
            />
            <span className="font-serif text-sm">
              Marketing texts (msg & data rates apply; reply STOP to quit). Requires a phone number above.
            </span>
          </label>
          <p className="font-mono text-[10px] text-[var(--pp-ink-soft)]">
            Essential messages (account, receipts, redemptions, security) are always delivered.
          </p>
        </div>

        <FavoritePicker
          initial={(favRestaurants ?? []).map((r: any) => ({ id: r.id, name: r.name, city: r.city }))}
        />

        {profile?.username && (
          <ReferralCard
            username={profile.username}
            referredCount={referredCount ?? 0}
          />
        )}

        <button className="btn-primary py-4 mt-2 text-sm">Save passport</button>
      </form>
    </div>
  );
}
