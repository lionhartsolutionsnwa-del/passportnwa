import Link from "next/link";

export default function ReceiptSubmittedPage() {
  return (
    <div className="flex flex-col items-center gap-5 text-center py-10">
      <div className="eyebrow">Received</div>
      <h1 className="headline text-3xl">Thank you, traveler</h1>
      <p className="font-serif italic text-[var(--pp-ink-soft)] max-w-xs">
        Your receipt is under review. Points will appear in your passport once the restaurant confirms your visit.
      </p>
      <div className="fleuron w-full max-w-xs">⌑</div>
      <Link href="/" className="btn-primary">Back to Journal</Link>
    </div>
  );
}
