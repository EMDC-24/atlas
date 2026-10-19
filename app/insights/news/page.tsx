import type { Metadata } from "next";

import NewsGrid from "@/components/sections/insights/NewsGrid";
import NewsHeader from "@/components/sections/insights/NewsHeader";
import NewsPagination from "@/components/sections/insights/NewsPagination";
import { insightMetadata } from "@/lib/content/insights";

export const metadata: Metadata = insightMetadata("Latest News", "/insights/news");

export default function InsightsNewsPage() {
  return (
    <>
      <NewsHeader />
      <NewsGrid />
      <NewsPagination />
    </>
  );
}
