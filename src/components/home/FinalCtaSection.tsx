import { Phone } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { ButtonArrow, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export function FinalCtaSection() {
  return (
    <section
      id="assessment"
      aria-labelledby="cta-title"
      className="on-dark scroll-mt-16 bg-brand text-white"
    >
      <Container className="max-w-6xl py-20 sm:py-24 lg:py-32">
        <SectionHeading
          id="cta-title"
          tone="inverse"
          size="large"
          title={
            <>
              <span className="sm:block">Find out what your roof needs.</span>{" "}
              <span className="sm:block">Then decide.</span>
            </>
          }
          description="It takes about two minutes, and there’s no obligation."
        />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4 lg:mt-12">
          <AdvisorButton className={buttonStyles({ variant: "inverse", size: "xl" })}>
            Start your assessment
            <ButtonArrow />
          </AdvisorButton>
          <a
            href={siteConfig.phone.href}
            className={buttonStyles({ variant: "inverse-outline", size: "xl" })}
          >
            <Phone aria-hidden="true" className="size-4" />
            {siteConfig.phone.display}
          </a>
        </div>
      </Container>
    </section>
  );
}
