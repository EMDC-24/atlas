import type { Metadata } from "next";

import LegalArticle from "@/components/legal/LegalArticle";
import { cookiePolicy } from "@/lib/content/legal/cookiePolicy";

// The original emits no meta description on any legal page, so `description`
// is nulled out to stop the root layout's from being inherited.
export const metadata: Metadata = {
  title: "Cookie Policy",
  description: null,
  alternates: { canonical: "/legal/cookie-policy" },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Atlas Intelligence",
    url: "https://www.atlasintelglobal.com/legal/cookie-policy",
    title: "Cookie Policy",
    images: [{ url: "/images/transforms/cover-thumb.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy",
    images: ["/images/transforms/cover-thumb.png"],
  },
};

export default function CookiePolicyPage() {
  return <LegalArticle content={cookiePolicy} />;
}
