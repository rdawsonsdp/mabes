import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import "./globals.css";

// Live Baskerville face. The Adobe Fonts families (berthold-baskerville-pro /
// baskerville-bt, set in globals.css) take over when TYPEKIT_KIT_ID is filled in;
// until then Libre Baskerville (the Google Baskerville revival) renders.
const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-baskerville",
  display: "swap",
});

// Adobe Fonts WEB PROJECT kit id — the short token in
// https://use.typekit.net/<id>.css (e.g. "pby8wsi"). This is NOT the Adobe API
// secret; never put an API token here (it would ship publicly). "" = use fallback.
const TYPEKIT_KIT_ID = "jmw1nja";

export const metadata: Metadata = {
  title: "Mabe's Sandwich Shop in Chicago, IL",
  description:
    "We offer made to order sandwiches, salads and smoothies served fresh daily. Your neighborhood sandwich shop. Located in Chicago, IL.",
  icons: { icon: "/favicon-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${baskerville.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">
        {TYPEKIT_KIT_ID && (
          <link rel="stylesheet" href={`https://use.typekit.net/${TYPEKIT_KIT_ID}.css`} />
        )}
        {children}
      </body>
    </html>
  );
}
