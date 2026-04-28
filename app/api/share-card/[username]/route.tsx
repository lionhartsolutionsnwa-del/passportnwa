import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Cache for 5 min on the edge — share cards don't need to be 100% fresh
export const revalidate = 300;

const W = 1080;
const H = 1920;

async function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`,
    { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" } },
  ).then((r) => r.text());
  const m = css.match(/src:\s*url\((.+?)\)\s*format\(['"](opentype|truetype|woff2?)['"]\)/);
  if (!m) throw new Error(`No font url for ${family} ${weight}`);
  const buf = await fetch(m[1]).then((r) => r.arrayBuffer());
  return buf;
}

function tier(spots: number) {
  if (spots >= 100) return "NWA Legend · L-3";
  if (spots >= 50)  return "Local · L-2";
  if (spots >= 10)  return "Regular · L-1";
  return "Explorer · L-0";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, points, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  // Stamp count + unique spots in parallel
  const [stampsRes, ratingsRes] = await Promise.all([
    admin
      .from("checkins")
      .select("restaurant_id", { count: "exact" })
      .eq("user_id", profile.id),
    admin
      .from("restaurant_ratings")
      .select("rating", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

  const stampCount = stampsRes.count ?? 0;
  const uniqueSpots = new Set((stampsRes.data ?? []).map((c) => c.restaurant_id)).size;
  const ratingsGiven = ratingsRes.count ?? 0;

  const [garamond, garamondBold, mono, monoBold] = await Promise.all([
    loadFont("EB Garamond", 400),
    loadFont("EB Garamond", 700),
    loadFont("JetBrains Mono", 500),
    loadFont("JetBrains Mono", 700),
  ]);

  // Resolve absolute URL for the logo
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const logoUrl = `${origin}/logo.png`;
  const tierLabel = tier(uniqueSpots);

  // Build the referral URL + QR code (rendered as a data URL we embed in <img />)
  const referralUrl = `https://www.passportnwa.com/login?ref=${encodeURIComponent(profile.username)}`;
  const qrDataUrl = await QRCode.toDataURL(referralUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 480,
    color: { dark: "#5b1f29", light: "#f1e4c8" },
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "80px 80px 80px 80px",
          background:
            "radial-gradient(ellipse at 50% 30%, #5b1f29 0%, #3d1219 60%, #2a1a0e 100%)",
          color: "#f1e4c8",
          fontFamily: "Garamond",
          position: "relative",
        }}
      >
        {/* Soft gold halo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 700,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(201,161,74,0.35), transparent 60%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          width={220}
          height={220}
          style={{
            borderRadius: "50%",
            border: "4px solid rgba(201,161,74,0.45)",
            boxShadow: "0 30px 80px -10px rgba(0,0,0,0.6)",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            marginTop: 40,
            fontFamily: "Mono",
            fontSize: 30,
            letterSpacing: 14,
            color: "#c9a14a",
            display: "flex",
          }}
        >
          PASSPORT NWA
        </div>

        {/* Divider */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: 0.7,
          }}
        >
          <div style={{ width: 100, height: 1, background: "#c9a14a" }} />
          <div style={{ fontSize: 28, color: "#c9a14a" }}>⌑</div>
          <div style={{ width: 100, height: 1, background: "#c9a14a" }} />
        </div>

        {/* Display Name */}
        <div
          style={{
            marginTop: 60,
            fontFamily: "GaramondBold",
            fontSize: 110,
            lineHeight: 1.05,
            textAlign: "center",
            color: "#f1e4c8",
            display: "flex",
            maxWidth: 880,
          }}
        >
          {profile.display_name ?? profile.username}
        </div>

        {/* Username */}
        <div
          style={{
            marginTop: 20,
            fontFamily: "Mono",
            fontSize: 36,
            color: "rgba(241,228,200,0.7)",
            display: "flex",
          }}
        >
          @{profile.username}
        </div>

        {/* Tier crest */}
        <div
          style={{
            marginTop: 50,
            padding: "16px 38px",
            border: "2px solid #c9a14a",
            borderRadius: 999,
            background: "rgba(201,161,74,0.1)",
            color: "#e6c688",
            fontFamily: "GaramondBold",
            fontSize: 32,
            letterSpacing: 6,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {tierLabel}
        </div>

        {/* Stats row */}
        <div
          style={{
            marginTop: 80,
            display: "flex",
            gap: 30,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {[
            { label: "Stamps", value: stampCount },
            { label: "Points", value: profile.points },
            { label: "Spots", value: uniqueSpots },
            { label: "Rated", value: ratingsGiven },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "26px 0",
                border: "1px solid rgba(201,161,74,0.3)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "GaramondBold",
                  fontSize: 76,
                  color: "#e6c688",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: "Mono",
                  fontSize: 18,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                  color: "rgba(241,228,200,0.6)",
                  marginTop: 12,
                  display: "flex",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Spacer pushes the bottom CTA down */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Referral CTA — QR code */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(0,0,0,0.28)",
            border: "1px solid rgba(201,161,74,0.35)",
            borderRadius: 24,
            padding: "44px 50px 42px",
            marginTop: 60,
            width: "100%",
            maxWidth: 880,
          }}
        >
          <div
            style={{
              fontFamily: "Mono",
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#c9a14a",
              display: "flex",
            }}
          >
            Scan to join · 25 pts each
          </div>

          {/* QR code on cream background, like a passport stamp */}
          <div
            style={{
              marginTop: 28,
              padding: 20,
              background: "#f1e4c8",
              borderRadius: 16,
              display: "flex",
              boxShadow: "0 12px 30px -8px rgba(0,0,0,0.5)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="" width={340} height={340} />
          </div>

          <div
            style={{
              marginTop: 22,
              fontFamily: "GaramondBold",
              fontSize: 30,
              color: "#f1e4c8",
              display: "flex",
            }}
          >
            @{profile.username}
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Garamond", data: garamond, weight: 400 },
        { name: "GaramondBold", data: garamondBold, weight: 700 },
        { name: "Mono", data: mono, weight: 500 },
        { name: "MonoBold", data: monoBold, weight: 700 },
      ],
    },
  );
}
