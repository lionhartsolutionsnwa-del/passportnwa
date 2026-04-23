import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--pp-cream-dark)] mt-12 pt-6 pb-8 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="fleuron">⌑</div>
        <div className="font-serif text-[var(--pp-burgundy)] mt-3">Passport NWA</div>
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--pp-ink-soft)] mt-1">
          Northwest Arkansas · USA
        </div>
        <address className="not-italic font-mono text-[10px] text-[var(--pp-ink-soft)] mt-3">
          Bentonville, AR 72712
          <br />
          <a href="mailto:hello@passportnwa.com" className="hover:text-[var(--pp-burgundy)]">hello@passportnwa.com</a>
        </address>

        <nav className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--pp-ink-soft)]">
          <Link href="/privacy" className="hover:text-[var(--pp-burgundy)]">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--pp-burgundy)]">Terms</Link>
          <Link href="/restaurants" className="hover:text-[var(--pp-burgundy)]">Atlas</Link>
          <Link href="/restaurant-signup" className="hover:text-[var(--pp-burgundy)]">For Restaurants</Link>
        </nav>

        <p className="font-mono text-[9px] text-[var(--pp-ink-soft)]/60 mt-4">
          © {new Date().getFullYear()} Passport NWA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
