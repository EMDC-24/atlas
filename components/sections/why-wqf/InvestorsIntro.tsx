"use client";

import Button from "@/components/ui/Button";
import { FadeIn, SplitTextReveal } from "@/components/ui/Reveal";

export default function InvestorsIntro() {
  return (
    <section
      className="bg-neural-fog text-rich-carbon rounded-t-[20px] pt-[120px] pb-[80px] text-center md:pt-[200px] md:pb-[100px]"
      id="investors"
    >
      <div className="container">
        <div className="mx-auto max-w-[732px]">
          <h2 className="p1-mono">government technology</h2>
          <SplitTextReveal as="h3" className="h2 pt-[12px] uppercase">
            Large programmes, delivered end to end.
          </SplitTextReveal>
          <FadeIn as="p" className="p1 mx-auto my-[24px] max-w-[550px] md:my-[32px]">
            Systems integration, hardware supply and long-term support, delivered
            under a single contract with vetted international manufacturing partners.
          </FadeIn>
          <Button
            theme="dark"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("contact-modal:open", { detail: "#contact" })
              )
            }
          >
            Connect with us
          </Button>
        </div>
      </div>
    </section>
  );
}
