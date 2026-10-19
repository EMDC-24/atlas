import { FadeIn, SplitTextReveal } from "@/components/ui/Reveal";

export default function FoundersIntro() {
  return (
    <section
      className="container pt-[120px] pb-[80px] text-center md:pt-[200px] md:pb-[100px]"
      id="founders"
    >
      <div className="mx-auto max-w-[732px]">
        <h2 className="p1-mono">atlas products</h2>
        <SplitTextReveal as="h3" className="h2 pt-[12px] uppercase">
          From idea to income. Guided.
        </SplitTextReveal>
        <FadeIn as="p" className="p1 mx-auto mt-[24px] max-w-[550px] md:mt-[32px]">
          Building a company shouldn&apos;t require a full executive team. Atlas
          Compass and Atlas Studio put senior-grade reasoning in one product, plus
          five platforms already in production, live online today.
        </FadeIn>
      </div>
    </section>
  );
}
