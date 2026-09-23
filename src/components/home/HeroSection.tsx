import { ArrowRight, Phone, Plus } from "lucide-react";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="on-dark relative min-h-[90vh] overflow-hidden bg-ink text-canvas"
    >
      {/* Dark overlay for text area, fading to show image on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink to-ink/0 pointer-events-none" />

      {/* Background placeholder for hero image (right side) */}
      <div className="absolute inset-0 hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/20 to-transparent opacity-40" />
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-slate-300 to-slate-200" />
      </div>

      <Container className="relative z-10 flex flex-col justify-center lg:min-h-[90vh] pt-20 pb-16 lg:pb-24">
        <div className="max-w-2xl">
          {/* Customer proof */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="size-10 rounded-full bg-canvas border-2 border-ink flex items-center justify-center text-sm font-semibold text-ink"
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <div className="size-10 rounded-full bg-accent text-white border-2 border-ink flex items-center justify-center text-sm font-semibold flex-shrink-0">
                <Plus className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="text-sm text-on-brand-muted">
              18k+ Satisfied Customers All Over New York
            </p>
          </div>

          {/* Eyebrow */}
          <Eyebrow tone="inverse" className="mb-4">
            ROOFING ASSESSMENT
          </Eyebrow>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="font-display text-display font-extrabold leading-tight"
          >
            Secure Safety With Strong Roofing.
          </h1>

          {/* Supporting text */}
          <p className="mt-6 text-lg text-pretty text-on-brand-muted max-w-lg">
            Shield your home with durable, long-lasting roofing. We deliver
            expert workmanship and quality materials to keep you safe in every
            season.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
