import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 font-serif leading-relaxed text-[var(--pp-ink)]">
      <Link href="/" className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">← Home</Link>
      <h1 className="headline text-4xl mt-4">Terms of Service</h1>
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--pp-ink-soft)] mt-2">
        Last updated: April 23, 2026
      </p>

      <Section title="Using Passport NWA">
        <p>By creating an account you agree to use the service honestly, including not:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Creating fake accounts, impersonating others, or abusing the platform</li>
          <li>Stamping or redeeming without being physically at the restaurant</li>
          <li>Uploading forged receipts or verification documents</li>
          <li>Posting illegal, harassing, hateful, or explicit content</li>
          <li>Scraping, reverse-engineering, or interfering with the service</li>
        </ul>
        <p className="mt-2">We can suspend or terminate accounts that violate these terms at our discretion.</p>
      </Section>

      <Section title="Your content">
        <p>
          You own the photos, captions, and reviews you post. You give Passport NWA a non-exclusive license to display them within the app and in Passport NWA marketing. You can delete your content anytime.
        </p>
      </Section>

      <Section title="Stamps, points, and perks">
        <ul className="list-disc pl-6 space-y-1">
          <li>Stamps and points have no cash value and are non-transferable.</li>
          <li>Points can be redeemed for rewards at participating restaurants, subject to each restaurant's terms and availability.</li>
          <li>We may adjust point balances to correct errors or abuse.</li>
          <li>Redemption codes are valid only at the listed restaurant, for the listed reward, and only when fulfilled by staff. Unfulfilled redemptions may be cancelled; cancelled redemptions refund points.</li>
        </ul>
      </Section>

      <Section title="For restaurants">
        <p>
          Restaurant accounts require verification before unlocking the Concierge dashboard. You agree to fulfill valid redemptions and be honest about offers. Abuse, fraud, or refusing to fulfill valid redemptions can result in removal from the platform.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          The service is provided as-is. We don't guarantee restaurants are open, that perks will be honored, or that the app will always work. Use your judgment.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the maximum extent permitted by law, Passport NWA is not liable for indirect, incidental, or consequential damages. Our total liability for any claim is limited to $100.
        </p>
      </Section>

      <Section title="Changes and governing law">
        <p>
          We may update these terms; material changes will be announced in-app or by email. These terms are governed by the laws of the State of Arkansas.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions: <a href="mailto:hello@passportnwa.com" className="text-[var(--pp-burgundy)] underline">hello@passportnwa.com</a>
        </p>
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
