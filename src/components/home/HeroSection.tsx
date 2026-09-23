import { ArrowRight, Phone } from "lucide-react";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export function HeroSection() {
  return (
    // Solid brand background for now. Roof photography (next/image) replaces it
    // once real images are available.
    <section
      aria-labelledby="hero-heading"
      className="on-dark bg-brand text-canvas"
    >
      <Container className="flex flex-col justify-end pt-36 pb-16 sm:pb-20 lg:min-h-200 lg:pb-24">
        <Eyebrow tone="inverse">Roofing Assessment</Eyebrow>
        <h1
          id="hero-heading"
          className="mt-5 font-display text-display font-extrabold uppercase"
        >
          <span className="block">Your roof.</span>
          <span className="block">Built to last.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-pretty text-on-brand-muted">
          Tell us what’s happening with your roof. Answer a few quick questions,
          add photos if you have them, and our roofing team will follow up to
          talk through your options.
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
      </Container>
    </section>
  );
}
