import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { ButtonArrow, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  { title: "Tell us what’s going on", detail: "Answer a few questions online, or call. Photos help." },
  { title: "We take a look", detail: "A roofer reviews your answers and visits if it needs a closer look." },
  { title: "You get a straight answer", detail: "What’s wrong, what it will cost, and what can wait." },
  { title: "We do the work", detail: "On a date that suits you. We clean up before we leave." },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="on-dark scroll-mt-16 bg-brand-strong text-white"
    >
      <Container className="max-w-6xl py-20 sm:py-24 lg:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <SectionHeading
            id="how-title"
            tone="inverse"
            title="From first question to finished roof"
            description="Here’s what happens after you get in touch."
          />
          <AdvisorButton className={buttonStyles({ variant: "inverse", size: "lg", className: "self-start lg:self-auto" })}>
            Start your assessment
            <ButtonArrow />
          </AdvisorButton>
        </div>

        <ol className="mt-14 grid gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:mt-20 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-[3.75rem_minmax(0,1fr)] border-t border-white/25 pt-6 sm:block"
            >
              <span
                aria-hidden="true"
                className="font-headline block text-4xl leading-none text-brand-bright tabular-nums sm:text-5xl lg:text-6xl"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xl leading-snug font-semibold sm:mt-8">{step.title}</h3>
                <p className="mt-2 max-w-[17rem] leading-relaxed text-white/80 sm:mt-3">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
