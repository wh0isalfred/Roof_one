import { ArrowRight, Phone } from "lucide-react";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="on-dark bg-brand text-canvas"
    >
      <Container className="py-20 lg:py-28">
        <div className="max-w-3xl">
          <h2
            id="final-cta-heading"
            className="font-display text-4xl font-extrabold uppercase sm:text-5xl lg:text-6xl"
          >
            Tell us what’s going on with your roof.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-on-brand-muted">
            Start the assessment online or give us a call. Either way, our team
            will help you figure out the next step.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/#assessment" variant="accent" size="lg">
              Get My Roof Assessment
              <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <a
              href={siteConfig.phone.href}
              className={buttonStyles({ variant: "inverse-outline", size: "lg" })}
            >
              <Phone aria-hidden="true" className="size-4" />
              Call Us
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
