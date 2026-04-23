import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 font-serif leading-relaxed text-[var(--pp-ink)]">
      <Link href="/" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">← Home</Link>
      <h1 className="headline text-4xl mt-4">Privacy Policy</h1>
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-2">
        Last updated: April 23, 2026
      </p>

      <Section title="Who we are">
        <p>
          Passport NWA is a restaurant loyalty platform serving Northwest Arkansas, operated from Bentonville, AR.
          Contact: <a href="mailto:hello@passportnwa.com" className="text-[var(--pp-burgundy)] underline">hello@passportnwa.com</a>.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc pl-6 space-y-1">
          <li>Account info you give us: email, username, display name, optional phone number, bio, avatar</li>
          <li>Activity on the app: check-ins (stamps), posts, photo uploads, receipts, rewards redeemed, companions</li>
          <li>Device and session data: IP address, browser, timestamps (for security and anti-abuse)</li>
          <li>If you sign up as a restaurant owner: business name, EIN, role, contact phone, and a verification document</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul className="list-disc pl-6 space-y-1">
          <li>To run your account and show your passport, stamps, and posts to you and other travelers</li>
          <li>To verify restaurant owners and prevent fraud</li>
          <li>To send <strong>transactional</strong> emails (account, receipt review outcomes, redemption confirmations) — these cannot be turned off while you have an account</li>
          <li>To send <strong>marketing</strong> emails or texts only if you've opted in. You can change this anytime in Settings.</li>
          <li>To improve the product (aggregate analytics only; we never sell individual data)</li>
        </ul>
      </Section>

      <Section title="Who sees what">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Public:</strong> your username, display name, avatar, bio, stamps, public posts, companions count, points</li>
          <li><strong>Private:</strong> your email, phone number, payment info, uploaded receipts, verification documents</li>
          <li><strong>Restaurants you visit</strong> see aggregated check-in data and — for receipts you submit — your username and uploaded receipt image</li>
        </ul>
      </Section>

      <Section title="Third parties">
        <p>We use these vendors to run the service:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase</strong> — database, auth, file storage</li>
          <li><strong>Vercel</strong> — web hosting</li>
          <li><strong>Resend</strong> — email delivery</li>
          <li><strong>Google Places</strong> — restaurant data</li>
        </ul>
        <p className="mt-2">We don't sell your data to anyone.</p>
      </Section>

      <Section title="Your choices">
        <ul className="list-disc pl-6 space-y-1">
          <li>Turn marketing emails or texts on/off anytime in <Link href="/settings" className="text-[var(--pp-burgundy)] underline">Settings</Link></li>
          <li>One-click unsubscribe from any marketing email</li>
          <li>Delete your account anytime — we'll remove your profile, check-ins, posts, and photos within 30 days</li>
          <li>Request a copy of your data: email <a href="mailto:hello@passportnwa.com" className="text-[var(--pp-burgundy)] underline">hello@passportnwa.com</a></li>
        </ul>
      </Section>

      <Section title="Children">
        <p>Passport NWA is for ages 13 and up. We don't knowingly collect data from anyone under 13.</p>
      </Section>

      <Section title="Changes">
        <p>We'll post any updates on this page and note a new "Last updated" date. Material changes will be announced in-app or by email.</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl text-[var(--pp-burgundy)]">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
