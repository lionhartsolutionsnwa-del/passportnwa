// Thin Resend wrapper. Uses the same API key Supabase SMTP uses.
// Reads RESEND_API_KEY if set, otherwise no-ops quietly.

const RESEND_API = "https://api.resend.com/emails";
const FROM = process.env.RESEND_FROM ?? "Passport NWA <noreply@passportnwa.com>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping:", subject, "→", to);
    return { skipped: true };
  }
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[email] send failed", res.status, t);
    return { error: t };
  }
  return { ok: true };
}
