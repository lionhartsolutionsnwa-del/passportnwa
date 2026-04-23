import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm text-center flex flex-col items-center gap-5">
        <div className="eyebrow">Application received</div>
        <h1 className="headline text-3xl">Under review</h1>
        <div className="fleuron w-full">⌑</div>
        <p className="font-serif italic text-[var(--pp-ink-soft)]">
          Thanks for applying. We'll verify your business in <strong>1–2 business days</strong> and notify you once approved.
        </p>
        <p className="font-serif italic text-[var(--pp-ink-soft)] text-sm">
          In the meantime you can sign in to see your dashboard, but rewards, QR codes, and receipt review unlock after approval.
        </p>
        <Link href="/login" className="btn-primary mt-2">Go to sign in</Link>
      </div>
    </main>
  );
}
