import type { Metadata } from "next";

import LegalArticle from "@/components/legal/LegalArticle";
import { termsAndConditions } from "@/lib/content/legal/termsAndConditions";

// The original emits no meta description on any legal page, so `description`
// is nulled out to stop the root layout's from being inherited.
export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: null,
  alternates: { canonical: "/legal/terms-and-conditions" },
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "Atlas Intelligence",
    url: "https://www.atlasintelglobal.com/legal/terms-and-conditions",
    title: "Terms and Conditions",
    images: [{ url: "/images/transforms/cover-thumb.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms and Conditions",
    images: ["/images/transforms/cover-thumb.png"],
  },
};

export default function TermsAndConditionsPage() {
  return <LegalArticle content={termsAndConditions} />;
}
