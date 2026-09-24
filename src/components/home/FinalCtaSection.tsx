import { ArrowRight, Phone } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export function FinalCtaSection() {
  return (
    <section
      id="assessment"
      aria-labelledby="cta-title"
      className="on-dark relative isolate scroll-mt-16 overflow-hidden bg-brand-strong text-white"
    >
      <RoofPhoto
        tone="soft"
        crop="object-[30%_55%] scale-[1.9] origin-[30%_55%]"
        sizes="60vw"
        className="-z-10 [clip-path:polygon(38%_0,100%_0,100%_100%,24%_100%)]"
      />
      <Container className="max-w-6xl py-16 lg:py-20">
        <SectionHeading
          id="cta-title"
          tone="inverse"
          eyebrow="Ready to get started"
          title="Your Roof Deserves the Best."
          description="Get your free roof assessment in just 2 minutes. No obligation."
          className="[&_p:last-child]:text-white/80"
        />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <AdvisorButton className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-bright">
            Get Your Roof Assessment
            <ArrowRight aria-hidden="true" className="size-4" />
          </AdvisorButton>
          <a
            href={siteConfig.phone.href}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/35 px-6 font-semibold transition-colors hover:border-white hover:bg-white/10"
          >
            <Phone aria-hidden="true" className="size-4" />
            Call Us
          </a>
        </div>
      </Container>
    </section>
  );
}
