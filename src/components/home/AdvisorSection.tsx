import { Camera, ListChecks, PhoneCall, Timer } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { ButtonArrow, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const FEATURES = [
  { icon: Timer, title: "About 2 minutes", detail: "Short questions, plain words" },
  { icon: Camera, title: "Photos if you have them", detail: "From the yard or the attic" },
  { icon: ListChecks, title: "Advice for your roof", detail: "Based on what you tell us" },
  { icon: PhoneCall, title: "A roofer calls you back", detail: "To talk through next steps" },
] as const;

/**
 * Introduces the Roofing Advisor. The questions themselves open in the
 * advisor, not on the page.
 */
export function AdvisorSection() {
  return (
    <section
      id="advisor"
      aria-labelledby="advisor-title"
      className="on-dark scroll-mt-16 bg-brand-strong py-20 text-white sm:py-24 lg:py-28"
    >
      <Container className="max-w-6xl">
        <SectionHeading
          id="advisor-title"
          tone="inverse"
          title={
            <>
              <span className="md:block">Not sure what’s wrong?</span>{" "}
              <span className="md:block">Start with what you can see.</span>
            </>
          }
        />

        <div className="mt-8 grid gap-12 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <p className="max-w-lg text-lg leading-relaxed text-white/85">
              A stain on the ceiling. Grit in the gutters. A shingle on the lawn.
              Answer a few questions about what you’ve noticed and it goes
              straight to our team.
            </p>
            <AdvisorButton className={buttonStyles({ variant: "inverse", size: "xl", className: "mt-10" })}>
              Start your assessment
              <ButtonArrow />
            </AdvisorButton>
          </div>

          <ul className="grid content-start gap-x-10 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-4 border-t border-white/25 pt-5 pb-6">
                <Icon aria-hidden="true" strokeWidth={1.8} className="mt-0.5 size-5 shrink-0 text-brand-bright" />
                <p className="leading-snug">
                  <span className="block font-semibold">{title}</span>
                  <span className="text-white/85">{detail}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
