// Thin Resend wrapper with CAN-SPAM compliance: physical address footer,
// one-click unsubscribe for marketing mail, List-Unsubscribe header.

const RESEND_API = "https://api.resend.com/emails";
const FROM = process.env.RESEND_FROM ?? "Passport NWA <noreply@passportnwa.com>";
const ADDRESS_FOOTER = "Passport NWA · Bentonville, AR 72712 · hello@passportnwa.com";

export type EmailKind = "transactional" | "marketing";

export async function sendEmail({
  to,
  subject,
  html,
  text,
  kind = "transactional",
  unsubscribeToken,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  kind?: EmailKind;
  unsubscribeToken?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping:", subject, "→", to);
    return { skipped: true };
  }

  const unsubUrl = unsubscribeToken
    ? `https://www.passportnwa.com/unsubscribe/${unsubscribeToken}`
    : null;

  const footer = unsubUrl
    ? `
<hr style="border: none; border-top: 1px solid #e0cfa6; margin: 24px 0" />
<div style="font-family: ui-sans-serif, sans-serif; font-size: 12px; color: #5b4a36; text-align: center">
  <p>${ADDRESS_FOOTER}</p>
  <p><a href="${unsubUrl}" style="color: #5b1f29">Unsubscribe from marketing emails</a></p>
</div>`
    : `
<hr style="border: none; border-top: 1px solid #e0cfa6; margin: 24px 0" />
<div style="font-family: ui-sans-serif, sans-serif; font-size: 12px; color: #5b4a36; text-align: center">
  <p>${ADDRESS_FOOTER}</p>
</div>`;

  const fullHtml = html ? html + footer : undefined;
  const fullText = text
    ? `${text}\n\n--\n${ADDRESS_FOOTER}${unsubUrl ? `\nUnsubscribe: ${unsubUrl}` : ""}`
    : undefined;

  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
  const body: Record<string, unknown> = { from: FROM, to, subject, html: fullHtml, text: fullText };

  // One-click unsubscribe for marketing emails (RFC 8058)
  if (kind === "marketing" && unsubUrl) {
    body.headers = {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  const res = await fetch(RESEND_API, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[email] send failed", res.status, t);
    return { error: t };
  }
  return { ok: true };
}
