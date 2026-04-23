import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { qrDataUrl, stampUrl } from "@/lib/qr";
import PrintButton from "./print-button";

export default async function PrintableQR({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ownership check
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, city, check_in_token")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) notFound();

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const { data: ownership } = await supabase
    .from("restaurant_owners")
    .select("user_id")
    .eq("restaurant_id", restaurant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me?.is_admin && !ownership) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = stampUrl(`${proto}://${host}`, restaurant.slug, restaurant.check_in_token);
  const png = await qrDataUrl(url);

  return (
    <div className="print-sheet bg-white min-h-screen -mx-5 -my-6 p-12 text-[var(--pp-ink)]">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          nav, header.sticky, .no-print { display: none !important; }
          body { background: white !important; }
          body::before { display: none !important; }
          .print-sheet { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <div className="max-w-md mx-auto text-center border border-[var(--pp-burgundy)] rounded-lg p-10 bg-[var(--pp-paper)]">
        <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-[var(--pp-burgundy)]">
          Passport NWA
        </div>
        <div className="fleuron mt-3">⌑</div>
        <h1 className="headline text-3xl mt-4">Stamp Your Passport</h1>
        <p className="font-serif italic text-[var(--pp-ink-soft)] mt-2 text-lg">
          Scan to earn stamps and rewards at {restaurant.name}.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png} alt="QR code" className="mx-auto mt-8 w-72 h-72 rounded-md" />
        <div className="font-mono text-[11px] tracking-[0.3em] uppercase mt-6">
          {restaurant.name} · {restaurant.city}
        </div>
        <div className="fleuron mt-4">⌑</div>
        <p className="font-mono text-[9px] text-[var(--pp-ink-soft)] mt-4">
          passportnwa.com
        </p>
      </div>
      <div className="text-center mt-6 no-print">
        <PrintButton />
      </div>
    </div>
  );
}
