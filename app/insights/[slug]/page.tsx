import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InsightArticle from "@/components/sections/insights/InsightArticle";
import RelatedArticles from "@/components/sections/insights/RelatedArticles";
import {
  getInsight,
  getInsights,
  insightArticles,
  insightMetadata,
} from "@/lib/content/insights";

/**
 * Every article page. `/insights/news` is a static sibling segment, so it wins
 * over this dynamic one and never resolves to a slug.
 */

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsight(slug);
  if (!article) return {};
  return insightMetadata(article.title, `/insights/${slug}`);
}

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const article = getInsight(slug);
  if (!article) notFound();

  return (
    <>
      <InsightArticle article={article} />
      <RelatedArticles articles={getInsights(article.relatedSlugs)} />
    </>
  );
}
