import type { Metadata } from "next";

import LegalArticle from "@/components/legal/LegalArticle";
import { privacyPolicy } from "@/lib/content/legal/privacyPolicy";

/**
 * Legacy `/privacy-policy` URL. The original serves the same page here as at
 * `/legal/privacy-policy` and canonicalises to the `/legal/` one -- kept rather
 * than redirected because Terms and Conditions links to this path.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: null,
  alternates: { canonical: "/legal/privacy-policy" },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Atlas Intelligence",
    url: "https://www.atlasintelglobal.com/legal/privacy-policy",
    title: "Privacy Policy",
    images: [{ url: "/images/transforms/cover-thumb.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    images: ["/images/transforms/cover-thumb.png"],
  },
};

export default function PrivacyPolicyPage() {
  return <LegalArticle content={privacyPolicy} />;
}
