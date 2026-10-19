import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/shell/SiteShell";

const TITLE = "Building the Operating System for Critical Decisions | Atlas Intelligence";
const DESCRIPTION =
  "Atlas Intelligence is a technology company headquartered in Islamabad, spanning government technology programmes, enterprise data platforms, and globally-distributed AI products.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.atlasintelglobal.com"),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Atlas Intelligence",
  referrer: "origin-when-cross-origin",
  robots: "all",
  manifest: "/assets/site.webmanifest",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/assets/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/assets/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "mask-icon", url: "/assets/safari-pinned-tab.svg", color: "#111111" },
    ],
  },
  appleWebApp: { title: "ATLAS" },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Atlas Intelligence",
    url: "https://www.atlasintelglobal.com/",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/images/transforms/cover-thumb.png",
        width: 1200,
        height: 630,
        alt: "Atlas Intelligence logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/transforms/cover-thumb.png"],
  },
  other: { "msapplication-TileColor": "#111111" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-rich-carbon text-neural-fog font-roc-grotesk">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
