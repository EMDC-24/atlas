import Image from "next/image";

import { SplitTextReveal } from "@/components/ui/Reveal";

interface CardData {
  surface: string;
  /** The number rule sits on a light or dark ground depending on the surface. */
  divider: string;
  title: string;
  src: string;
  height: number;
  number: string;
  body: string;
}

const LEFT_COLUMN: CardData[] = [
  {
    surface: "bg-urban-smoke text-neural-fog",
    divider: "border-off-white/20",
    title: "JV-led public-sector entry.",
    src: "/images/files/investors-1.svg",
    height: 2040.82,
    number: "01",
    body: "Tender-specific joint ventures with established international OEMs accelerate eligibility on hardware-bearing and large-software programmes–the fastest credible route into public-sector procurement.",
  },
  {
    surface: "bg-electric-teal text-rich-carbon",
    divider: "border-rich-carbon/20",
    title: "Manufacturing partners you can vet.",
    src: "/images/files/investors-2.svg",
    height: 2000,
    number: "02",
    body: "Reference deployments across sectors, established international OEMs, and a track record that stands up to due diligence. In government technology, credibility determines who qualifies–and who delivers.",
  },
];

const RIGHT_COLUMN: CardData[] = [
  {
    surface: "bg-infrared text-rich-carbon",
    divider: "border-rich-carbon/20",
    title: "One contract, every layer.",
    src: "/images/files/investors-3.svg",
    height: 2000,
    number: "03",
    body: "Systems integration, hardware supply and long-term support brought together under a single contract. No handoffs between vendors, no gaps in accountability across the programme lifecycle.",
  },
  {
    surface: "bg-off-white text-rich-carbon",
    divider: "border-rich-carbon/20",
    title: "Support that outlasts the launch.",
    src: "/images/files/investors-4.svg",
    height: 2040.82,
    number: "04",
    body: "Long-term maintenance and support built into every programme from day one. Full visibility into delivery, with the continuity that large public-sector systems demand.",
  },
];

function InvestorCard({ card }: { card: CardData }) {
  return (
    <div
      className={`${card.surface} flex min-h-[300px] w-full flex-col justify-between gap-[32px] rounded-[20px] px-[20px] py-[40px] md:aspect-[1.3/1] md:min-h-[550px] md:px-[40px] md:py-[60px]`}
    >
      <div className="flex items-center justify-between gap-[32px]">
        <SplitTextReveal
          as="h3"
          className="h6 min-[830px]:h5 max-w-[360px] text-balance uppercase"
        >
          {card.title}
        </SplitTextReveal>
        <picture className="size-[32px] md:size-[60px] shrink-0">
          <Image
            alt=""
            className="size-full object-contain"
            height={card.height}
            sizes="(min-width: 1400px) 1400px, calc(100vw - 32px)"
            src={card.src}
            width={2000}
          />
        </picture>
      </div>
      <div className="flex flex-col gap-[20px] md:gap-[32px]">
        <div className={`${card.divider} border-b pb-[9px]`}>
          <p className="p1-mono">{card.number}</p>
        </div>
        <p className="md:pb p1">{card.body}</p>
      </div>
    </div>
  );
}

export default function InvestorsCards() {
  return (
    <section className="bg-neural-fog text-rich-carbon rounded-b-[20px] pt-[64px] pb-[120px] md:pt-[80px] md:pb-[200px]">
      <div className="container grid gap-[8px] md:grid-cols-2 md:gap-[24px]">
        <div className="flex flex-col gap-[8px] md:gap-[24px]">
          {LEFT_COLUMN.map((card) => (
            <InvestorCard key={card.number} card={card} />
          ))}
        </div>
        {/* The right column is dropped 220px on desktop so the two stacks stagger. */}
        <div className="flex flex-col gap-[8px] md:mt-[220px] md:gap-[24px]">
          {RIGHT_COLUMN.map((card) => (
            <InvestorCard key={card.number} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
