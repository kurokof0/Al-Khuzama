import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al-Khuzama | Lavender Rose Luxury Resort",
  description:
    "A premium bilingual resort website prototype for Al-Khuzama (الخزامى) featuring a 3D showcase, smart booking engine, add-on store, and GCC-ready payments.",
  keywords: [
    "Al-Khuzama",
    "الخزامى",
    "Luxury resort Saudi Arabia",
    "Lavender Rose resort",
    "Mada Apple Pay STC Pay booking",
  ],
  openGraph: {
    title: "Al-Khuzama | Lavender Rose Luxury Resort",
    description:
      "Explore Al-Khuzama through an interactive 3D showcase, reserve premium stays, and add curated hospitality services.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7f5a83",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
