import { ArrowRight } from "lucide-react";
import { roofTexture } from "@/assets/photos";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
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
      className="on-dark relative isolate scroll-mt-16 overflow-hidden bg-brand-strong text-white"
    >
      <RoofPhoto src={roofTexture} tone="soft" crop="object-center" sizes="100vw" className="-z-10" />
      <Container className="max-w-6xl py-20 lg:py-24">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="how-title"
            tone="inverse"
            title="From first question to finished roof"
            description="Here’s what happens after you get in touch."
          />
          <AdvisorButton className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-bright sm:self-auto">
            Get started
            <ArrowRight aria-hidden="true" className="size-4" />
          </AdvisorButton>
        </div>

        <ol className="relative mt-14 grid gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          <span
            aria-hidden="true"
            className="absolute top-5 right-0 left-5 hidden h-px bg-white/25 lg:block"
          />
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative lg:pr-8 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-white/15 lg:[&:not(:first-child)]:pl-8"
            >
              <span className="relative flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold ring-4 ring-brand-strong">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-white/75">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
