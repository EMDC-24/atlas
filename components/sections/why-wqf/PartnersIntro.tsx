"use client";

import Button from "@/components/ui/Button";
import { FadeIn, SplitTextReveal } from "@/components/ui/Reveal";

export default function PartnersIntro() {
  return (
    <section
      className="container pt-[120px] pb-[80px] text-center md:pt-[200px] md:pb-[100px]"
      id="partners"
    >
      <div className="mx-auto flex max-w-[732px] flex-col items-center">
        <h2 className="p1-mono">enterprise platforms</h2>
        <SplitTextReveal as="h3" className="h2 pt-[12px] uppercase">
          From signal to action, at enterprise scale.
        </SplitTextReveal>
        <FadeIn as="p" className="p1 mx-auto my-[24px] max-w-[550px] md:my-[32px]">
          Atlas Sentinel and Atlas Forge connect to the systems you already
          run–no rebuild, no rip-and-replace–and turn scattered data into a
          single, decision-ready picture.
        </FadeIn>
        <Button
          theme="light"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("contact-modal:open", { detail: "#contact" })
            )
          }
        >
          talk to us
        </Button>
      </div>
    </section>
  );
}
