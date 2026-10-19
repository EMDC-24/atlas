import type { Metadata } from "next";

/**
 * Every insight article, transcribed from the scraped pages.
 *
 * Order matches the source listing at /insights/news (newest first), which is
 * also the order both listing pages render.
 *
 * `bodyHtml` is the untouched inner markup of the original `.prose--rich`
 * container. It is static, trusted content from the scrape and is injected with
 * `dangerouslySetInnerHTML`.
 */

export interface InsightImage {
  src: string;
  width: number;
  height: number;
}

export interface InsightArticle {
  slug: string;
  /** The page's own <title>; used verbatim for metadata. */
  title: string;
  /** The <h1> / card heading. Differs from `title` where the CMS truncated it. */
  heading: string;
  excerpt: string;
  /** The chip above the hero title, e.g. "Latest News". */
  category: string;
  readTime: string;
  date: string;
  image: InsightImage;
  /** "Read on BusinessWire" style outbound link below the body, if present. */
  externalLink: { label: string; href: string } | null;
  relatedSlugs: string[];
  bodyHtml: string;
}

export const insightArticles: InsightArticle[] = [
  {
    slug: "atlas-studio-software-on-a-canvas",
    title: "Atlas Studio Launches: Software on a Canvas",
    heading: "Atlas Studio Launches: Software on a Canvas",
    excerpt: "Atlas Intelligence launches Atlas Studio, a no-code, canvas-first builder that turns ideas into real, deployable software.",
    category: "Latest News",
    readTime: "3 min read",
    date: "Jul 15 2026",
    image: { src: "/images/transforms/16x9-amir-husain.jpg", width: 2000, height: 1123 },
    externalLink: null,
    relatedSlugs: ["atlas-compass-opens-access-for-founders-building-their-first-company", "atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking", "atlas-intelligence-launches"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced the launch of Atlas Studio, a no-code, canvas-first builder that lets teams design and ship real, deployable software without writing code by hand. Under the tagline &ldquo;Software on a canvas,&rdquo; Atlas Studio is built for people who think visually &mdash; product owners, operators and founders who know exactly what they want a piece of software to do but don't want to wait on a traditional development queue to get it built.</p><p style="margin-left:0px;">Rather than producing throwaway prototypes, Atlas Studio is designed to output working software that can be deployed and maintained like any other application in an organization's stack. Users compose logic, data and interface elements directly on a canvas, and the platform handles the underlying implementation.</p><p style="margin-left:0px;">Atlas Studio joins Atlas Intelligence's growing product line, which spans government technology, enterprise data platforms including Atlas Sentinel and Atlas Forge, and products such as Atlas Compass, Agnate, Kourier, Atlas ERP, Kanon and Nexcol. The company was established in 2026 and today counts 72 personnel and 24 technology partners across its portfolio.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said Atlas Studio reflects the same underlying philosophy that shapes its other platforms: that the gap between an idea and working software should be as short as possible, and that the tools people use to build should match how they actually think.</p><p style="margin-left:0px;">Atlas Studio is available now. Organizations interested in early access can reach the Atlas Intelligence team at <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners.</p>`,
  },
  {
    slug: "atlas-intelligence-completes-city-scale-digital-twin-of-los-angeles-for-taft-consulting",
    title: "Atlas Intelligence Completes a City-Scale Digital Twin of Los Angeles for Taft Consulting",
    heading: "Atlas Intelligence Completes a City-Scale Digital Twin of Los Angeles for Taft Consulting",
    excerpt: "Atlas Intelligence delivers a city-scale architectural-visualisation digital twin of Los Angeles for Taft Consulting.",
    category: "Latest News",
    readTime: "3 min read",
    date: "Jun 22 2026",
    image: { src: "/images/transforms/Amir_Husain_Hero.jpg", width: 2000, height: 1242 },
    externalLink: null,
    relatedSlugs: ["notello-atlass-ai-assisted-cooperation-platform-now-in-production", "atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking", "atlas-studio-software-on-a-canvas"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced the completion of a city-scale architectural-visualisation digital twin of Los Angeles, delivered for Taft Consulting. It models the city at scale to support architectural and urban-planning visualisation work, giving Taft Consulting's teams a shared, spatially accurate reference for evaluating designs in context.</p><p style="margin-left:0px;">Building a digital twin at city scale requires reconciling large volumes of spatial, structural and geographic data into a single coherent model. Atlas Intelligence's delivery team worked through this process end-to-end, producing a digital twin that Taft Consulting can use across its architectural-visualisation workflows.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said the Taft Consulting engagement reflects the company's broader approach to delivery work: taking on technically demanding, data-intensive problems and building purpose-built systems to solve them, rather than forcing a client's needs into an off-the-shelf tool.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners. For more information, contact <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p>`,
  },
  {
    slug: "notello-atlass-ai-assisted-cooperation-platform-now-in-production",
    title: "Notello: Atlas's AI-Assisted Cooperation Platform Now in Production",
    heading: "Notello: Atlas's AI-Assisted Cooperation Platform Now in Production",
    excerpt: "Notello, the AI-assisted real-time cooperation platform built by Atlas Intelligence, is now live in production.",
    category: "Latest News",
    readTime: "3 min read",
    date: "Jun 3 2026",
    image: { src: "/images/transforms/Chris-Mason-hero.jpg", width: 2000, height: 1242 },
    externalLink: null,
    relatedSlugs: ["atlas-intelligence-delivers-ai-enabled-herd-monitoring-for-omega-dairy-farms", "atlas-compass-opens-access-for-founders-building-their-first-company", "atlas-intelligence-completes-city-scale-digital-twin-of-los-angeles-for-taft-consulting"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced that Notello, an AI-assisted real-time cooperation platform built by the company, is now live in production. Notello is designed to help teams work together on shared material in real time, with AI assistance woven into the collaboration flow rather than bolted on as a separate feature.</p><p style="margin-left:0px;">The move to production follows a period of development and testing during which Atlas Intelligence's delivery team worked closely with Notello to shape the platform's real-time collaboration architecture and its AI-assisted features.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said Notello's launch reflects the company's continued focus on building software that puts AI directly into the workflows people already use, rather than treating it as a separate destination.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners. For more information, contact <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p>`,
  },
  {
    slug: "atlas-compass-opens-access-for-founders-building-their-first-company",
    title: "Atlas Compass Opens Access for Founders Building Their First Company",
    heading: "Atlas Compass Opens Access for Founders Building Their First Company",
    excerpt: "Atlas Intelligence opens access to Atlas Compass, a gamified guided journey through a startup's first 12 months.",
    category: "Latest News",
    readTime: "3 min read",
    date: "May 18 2026",
    image: { src: "/images/transforms/jorik-kleen-gEQKilqT6bU-unsplash.jpg", width: 2000, height: 1333 },
    externalLink: null,
    relatedSlugs: ["atlas-studio-software-on-a-canvas", "atlas-intelligence-launches", "notello-atlass-ai-assisted-cooperation-platform-now-in-production"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced that Atlas Compass is now open to founders building their first company. Described by the company as &ldquo;a team of senior operators, on demand,&rdquo; Atlas Compass is a gamified guided journey through a startup's first 12 months, structured to give first-time founders a clear, sequenced path through the decisions that most shape a company's early trajectory.</p><p style="margin-left:0px;">Rather than leaving founders to piece together advice from scattered sources, Atlas Compass sequences the work of the first year into a guided journey, pairing founders with the kind of operator input that is normally hard to access this early &mdash; packaged into a structured, gamified format that tracks progress along the way.</p><p style="margin-left:0px;">Atlas Compass sits alongside Atlas Studio in Atlas Intelligence's product portfolio, which also spans government technology, the enterprise data platforms Atlas Sentinel and Atlas Forge, and products including Agnate, Kourier, Atlas ERP, Kanon and Nexcol.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said Atlas Compass is built on the recognition that the first twelve months of a company's life disproportionately determine everything that follows, and that founders benefit most when guidance is structured, sequenced and available on demand rather than delivered piecemeal.</p><p style="margin-left:0px;">Founders interested in Atlas Compass can reach the Atlas Intelligence team at <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners.</p>`,
  },
  {
    slug: "atlas-intelligence-delivers-ai-enabled-herd-monitoring-for-omega-dairy-farms",
    title: "Atlas Intelligence Delivers AI-Enabled Herd Monitoring for Omega Dairy Farms",
    heading: "Atlas Intelligence Delivers AI-Enabled Herd Monitoring for Omega Dairy Farms",
    excerpt: "Atlas Intelligence delivers an AI-enabled herd monitoring system for Omega Dairy Farms, its first agriculture-sector project.",
    category: "Latest News",
    readTime: "3 min read",
    date: "Apr 27 2026",
    image: { src: "/images/transforms/WQF__0015_Advisor_Dmitry-Green.jpg", width: 2000, height: 2469 },
    externalLink: null,
    relatedSlugs: ["atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking", "notello-atlass-ai-assisted-cooperation-platform-now-in-production", "atlas-intelligence-launches-atlas-sentinel-for-civil-security-and-financial-crime-operators"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced the delivery of an AI-enabled herd monitoring system for Omega Dairy Farms. The system applies AI to the day-to-day work of monitoring livestock, giving Omega Dairy Farms' operations team a more consistent, data-driven view of herd health and behaviour than manual observation alone can provide.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said the Omega Dairy Farms engagement illustrates how the company approaches delivery work generally: understanding the specific operational reality of a client's environment first, then building an AI system suited to it, rather than adapting a generic product to fit.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners. For more information, contact <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p>`,
  },
  {
    slug: "atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking",
    title: "Atlas Forge Brings the Enterprise Data OS to Pakistani Banking",
    heading: "Atlas Forge Brings the Enterprise Data OS to Pakistani Banking",
    excerpt: "Atlas Intelligence brings Atlas Forge, its enterprise data operating system, to banking, telecom and energy clients.",
    category: "Latest News",
    readTime: "4 min read",
    date: "Apr 5 2026",
    image: { src: "/images/transforms/Apha_deal_launch.jpg", width: 2000, height: 1123 },
    externalLink: null,
    relatedSlugs: ["atlas-intelligence-launches-atlas-sentinel-for-civil-security-and-financial-crime-operators", "atlas-intelligence-launches", "atlas-studio-software-on-a-canvas"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced that Atlas Forge, its enterprise data platform, is now deployed with clients in banking, telecom and energy. Described by the company as &ldquo;the data OS for the enterprise,&rdquo; Atlas Forge connects every system of record within an organisation, builds a living ontology across that data, and lets teams compose applications directly on top of it.</p><p style="margin-left:0px;">For large, established organisations, data typically lives fragmented across dozens of systems of record, each with its own structure and lifecycle. Atlas Forge is built to sit across that fragmentation, connecting the underlying systems and maintaining a living, continuously updated ontology that teams can build applications against, rather than replacing or migrating the systems themselves.</p><p style="margin-left:0px;">Atlas Forge is used across banking, telecom, energy and public-sector settings, sectors where the volume and sensitivity of data make a unified operating layer especially valuable. It is one of two enterprise data platforms in the Atlas Intelligence portfolio, alongside Atlas Sentinel, and complements the company's product line, which includes Atlas Compass, Atlas Studio, Agnate, Kourier, Atlas ERP, Kanon and Nexcol.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said Atlas Forge reflects the conviction that most enterprises don't need another point solution &mdash; they need a durable data layer that every future system, application and AI initiative can be built on top of.</p><p style="margin-left:0px;">Atlas Forge is available for on-premises, sovereign cloud, hybrid or managed deployment. Organisations interested in Atlas Forge can reach the Atlas Intelligence team at <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners.</p>`,
  },
  {
    slug: "atlas-intelligence-launches-atlas-sentinel-for-civil-security-and-financial-crime-operators",
    title: "Atlas Intelligence Launches Atlas Sentinel for Civil Security and Financial-Crime Operators",
    heading: "Atlas Intelligence Launches Atlas Sentinel for Civil Security and Financial-Crime Operators",
    excerpt: "Atlas Intelligence launches Atlas Sentinel, a decision-intelligence platform for investigation, monitoring and operations.",
    category: "Latest News",
    readTime: "4 min read",
    date: "Mar 10 2026",
    image: { src: "/images/transforms/Picture1.jpg", width: 2000, height: 1503 },
    externalLink: null,
    relatedSlugs: ["atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking", "atlas-intelligence-launches", "atlas-intelligence-delivers-ai-enabled-herd-monitoring-for-omega-dairy-farms"],
    bodyHtml: `<p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced the launch of Atlas Sentinel, a decision-intelligence platform built for investigation, monitoring and operations work. Under the tagline &ldquo;From signal to action,&rdquo; Atlas Sentinel is aimed at operators in civil security, financial crime, critical infrastructure and regulatory bodies who need to move from raw signal to a defensible operational decision quickly.</p><p style="margin-left:0px;">Atlas Sentinel is built to support the full arc of an investigation or monitoring operation, from the point signals first surface through to the action taken in response. It is available for on-premises, sovereign cloud, hybrid or fully managed deployment, giving public-sector and regulated clients flexibility over how and where their data and workloads are hosted.</p><p style="margin-left:0px;">The platform is one of two enterprise data platforms Atlas Intelligence has built, alongside Atlas Forge, and sits within the company's government technology pillar, which also includes joint-venture-led public-sector programme delivery carried out with international manufacturing partners.</p><p style="margin-left:0px;">In a statement, Atlas Intelligence said Atlas Sentinel was built in direct response to the operational reality facing civil security, financial-crime and critical-infrastructure teams: that the hard part is rarely a lack of data, but the distance between having a signal and being able to act on it with confidence.</p><p style="margin-left:0px;">Organisations in civil security, financial crime, critical infrastructure and regulatory sectors interested in Atlas Sentinel can reach the Atlas Intelligence team at <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners.</p>`,
  },
  {
    slug: "atlas-intelligence-launches",
    title: "Atlas Intelligence Launches",
    heading: "Atlas Intelligence Launches",
    excerpt: "Atlas Intelligence launches as an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products.",
    category: "Latest News",
    readTime: "3 min read",
    date: "Feb 2 2026",
    image: { src: "/images/transforms/worldquant-foundry-launch.jpg", width: 2000, height: 1333 },
    externalLink: null,
    relatedSlugs: ["atlas-intelligence-launches-atlas-sentinel-for-civil-security-and-financial-crime-operators", "atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking", "atlas-compass-opens-access-for-founders-building-their-first-company"],
    bodyHtml: `<p style="margin-left:0px;"><i>Islamabad-based company brings government technology, enterprise data platforms and a product portfolio under one roof</i></p><p style="margin-left:0px;">ISLAMABAD, Pakistan &mdash; Atlas Intelligence today announced its launch as a technology company spanning government technology, enterprise data platforms and a portfolio of products. Established in 2026 and based in Islamabad, the company begins operations with 72 personnel and 24 technology partners.</p><p style="margin-left:0px;">Atlas Intelligence's work spans three broad areas. Its government technology pillar includes joint-venture-led public-sector programme delivery carried out with international manufacturing partners. Its enterprise data platforms &mdash; Atlas Sentinel and Atlas Forge &mdash; give investigation, monitoring and operations teams, and large enterprises respectively, a common layer to work from. And its product portfolio spans Atlas Compass, Atlas Studio, Agnate, Kourier, Atlas ERP, Kanon and Nexcol.</p><p style="margin-left:0px;"></p><p style="margin-left:0px;">In a statement, Atlas Intelligence said the company was built around a simple premise: that government bodies, enterprises and founders are all, in different ways, trying to solve the same underlying problem &mdash; turning fragmented data and manual process into systems that let people make better decisions faster &mdash; and that a single company with the right range of platforms and products is well placed to serve all three.</p><p style="margin-left:0px;">Atlas Intelligence is based in Islamabad, Pakistan. For more information, contact <a href="mailto:info@atlasintelglobal.com">info@atlasintelglobal.com</a>.</p><p style="margin-left:0px;"><strong>About Atlas Intelligence</strong></p><p style="margin-left:0px;">Atlas Intelligence is an Islamabad-based technology company spanning government technology, enterprise data platforms and a portfolio of products used across banking, telecom, energy, agriculture, education and public-sector programmes. Established in 2026, the company has grown to 72 personnel and 24 technology partners.</p>`,
  },
];

/** Slugs shown on /insights, in order -- the source page omits the oldest article. */
export const featuredInsightSlugs: string[] = [
  "atlas-studio-software-on-a-canvas",
  "atlas-intelligence-completes-city-scale-digital-twin-of-los-angeles-for-taft-consulting",
  "notello-atlass-ai-assisted-cooperation-platform-now-in-production",
  "atlas-compass-opens-access-for-founders-building-their-first-company",
  "atlas-intelligence-delivers-ai-enabled-herd-monitoring-for-omega-dairy-farms",
  "atlas-forge-brings-the-enterprise-data-os-to-pakistani-banking",
  "atlas-intelligence-launches-atlas-sentinel-for-civil-security-and-financial-crime-operators",
];

const bySlug = new Map(insightArticles.map((a) => [a.slug, a]));

export function getInsight(slug: string): InsightArticle | undefined {
  return bySlug.get(slug);
}

export function getInsights(slugs: string[]): InsightArticle[] {
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((a): a is InsightArticle => a !== undefined);
}

/**
 * Head tags for any page in the insights section.
 *
 * None of these pages carried a meta description, so `description` is nulled to
 * stop the root layout's from being inherited. `openGraph` and `twitter` are
 * spelled out in full because Next replaces -- rather than merges -- nested
 * metadata objects from parent segments.
 */
export function insightMetadata(title: string, path: string): Metadata {
  return {
    title,
    description: null,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en",
      siteName: "Atlas Intelligence",
      url: `https://www.atlasintelglobal.com${path}`,
      title,
      images: [{ url: "/images/transforms/cover-thumb.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: ["/images/transforms/cover-thumb.png"],
    },
  };
}
