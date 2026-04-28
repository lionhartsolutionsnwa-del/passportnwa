import type { Metadata, Viewport } from "next";
import { EB_Garamond, JetBrains_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.passportnwa.com"),
  title: {
    default: "Passport NWA — Loyalty for Northwest Arkansas's Best Independent Restaurants",
    template: "%s",
  },
  description:
    "Stamp your passport at every great independent restaurant in Northwest Arkansas. Earn points, leave field notes, and discover the best spots in Bentonville, Rogers, Fayetteville, and Springdale.",
  manifest: "/manifest.json",
  keywords: [
    "Northwest Arkansas restaurants",
    "Bentonville dining",
    "Fayetteville restaurants",
    "Rogers restaurants",
    "NWA loyalty",
    "Passport NWA",
    "best restaurants NWA",
    "Arkansas dining guide",
  ],
  authors: [{ name: "Passport NWA" }],
  openGraph: {
    type: "website",
    siteName: "Passport NWA",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7eeda",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${garamond.variable} ${mono.variable} ${inter.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
