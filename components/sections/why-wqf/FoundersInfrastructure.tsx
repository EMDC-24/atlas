"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import Button from "@/components/ui/Button";
import { SplitTextReveal } from "@/components/ui/Reveal";

const SERVICES: { title: ReactNode; src: string; body: string }[] = [
  {
    title: <>A guided journey, not a chat window.</>,
    src: "/images/files/why-service-1.svg",
    body: "Market analysis, compliance, growth, product and finance: Atlas Compass structures the first twelve months into missions and levels. The senior-level thinking that used to take a full advisory retainer is already built in.",
  },
  {
    title: (
      <>
        Real software,
        <br />
        not a prototype.
      </>
    ),
    src: "/images/files/why-service-2.svg",
    body: "Atlas Studio's canvas treats every layer (data models, auth, integrations, jobs, APIs) as a first-class citizen. No bloat. No hand-off to engineering. Just deployable software from a single surface.",
  },
  {
    title: (
      <>
        Subscriptions
        <br />
        from day one.
      </>
    ),
    src: "/images/files/why-service-3.svg",
    body: "No procurement cycle, no lengthy contract. Buy Atlas Compass, Atlas Studio, or any of the five commercial platforms online and start the same day, with team and enterprise tiers when you're ready to scale.",
  },
];

export default function FoundersInfrastructure() {
  return (
    <section className="container py-[80px] md:py-[100px]">
      <div className="border-off-white/20 grid items-end gap-[24px] border-b pb-[20px] md:grid-cols-2 md:pb-[24px]">
        <div>
          <Button
            theme="light"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("contact-modal:open", { detail: "#contact" })
              )
            }
          >
            Connect with us
          </Button>
        </div>
        <SplitTextReveal
          as="h2"
          className="h4 order-first max-w-[553px] uppercase md:order-0"
        >
          Senior-grade reasoning,
          <br />
          ready from day one.
        </SplitTextReveal>
      </div>
      <div className="mt-[56px] grid gap-[40px] gap-y-[80px] md:mt-[100px] md:grid-cols-3">
        {SERVICES.map((service) => (
          <div key={service.src}>
            <div className="flex items-center justify-between gap-[20px] md:gap-[24px]">
              <SplitTextReveal as="h3" className="h5 uppercase">
                {service.title}
              </SplitTextReveal>
              <picture className="">
                <Image
                  alt=""
                  className="size-[32px] object-contain"
                  height={2000}
                  sizes="(min-width: 1400px) 1400px, calc(100vw - 32px)"
                  src={service.src}
                  width={2000}
                />
              </picture>
            </div>
            <p className="p2 border-off-white/20 mt-[24px] border-t pt-[24px] md:mt-[100px] md:pt-[32px]">
              {service.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
