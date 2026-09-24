import { ArrowRight, Phone } from "lucide-react";
import { roofTexture } from "@/assets/photos";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { Accent, SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export function FinalCtaSection() {
  return (
    <section
      id="assessment"
      aria-labelledby="cta-title"
      className="on-dark relative isolate scroll-mt-16 overflow-hidden bg-brand-strong text-white"
    >
      <RoofPhoto
        src={roofTexture}
        tone="soft"
        crop="object-[70%_50%]"
        sizes="70vw"
        className="-z-10 [clip-path:polygon(40%_0,100%_0,100%_100%,26%_100%)]"
      />
      <Container className="max-w-6xl py-20 lg:py-24">
        <SectionHeading
          id="cta-title"
          tone="inverse"
          title={
            <>
              Find out what your roof needs.{" "}
              <Accent tone="inverse">Then decide.</Accent>
            </>
          }
          description="It takes about two minutes, and there’s no obligation."
        />
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <AdvisorButton className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-accent px-7 font-semibold text-white transition-colors hover:bg-accent-strong">
            Get a roof assessment
            <ArrowRight aria-hidden="true" className="size-4" />
          </AdvisorButton>
          <a
            href={siteConfig.phone.href}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-white/35 px-7 font-semibold transition-colors hover:border-white hover:bg-white/10"
          >
            <Phone aria-hidden="true" className="size-4" />
            {siteConfig.phone.display}
          </a>
        </div>
      </Container>
    </section>
  );
}
