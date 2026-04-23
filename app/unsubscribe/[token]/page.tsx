import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { token } = await params;
  const { type = "email" } = await searchParams;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, email_marketing_consent, sms_marketing_consent")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!profile) {
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center font-serif">
        <h1 className="headline text-3xl">Link not valid</h1>
        <p className="text-[var(--pp-ink-soft)] italic mt-3">
          This unsubscribe link isn't recognized. You may already be unsubscribed.
        </p>
      </main>
    );
  }

  const update: Record<string, unknown> = { consent_updated_at: new Date().toISOString() };
  if (type === "sms") update.sms_marketing_consent = false;
  else               update.email_marketing_consent = false;

  await admin.from("profiles").update(update).eq("id", profile.id);

  return (
    <main className="max-w-md mx-auto px-6 py-16 text-center font-serif">
      <div className="eyebrow">Unsubscribed</div>
      <h1 className="headline text-3xl mt-3">You're off the list</h1>
      <div className="fleuron mt-5">⌑</div>
      <p className="text-[var(--pp-ink-soft)] italic mt-4">
        We won't send any more marketing {type === "sms" ? "texts" : "emails"} to @{profile.username}. You'll still receive essential account messages (receipts, redemptions, security).
      </p>
      <Link href="/settings" className="btn-ghost mt-6 inline-flex">Adjust all preferences</Link>
    </main>
  );
}
