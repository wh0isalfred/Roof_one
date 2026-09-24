import { ArrowRight } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  { title: "Tell Us What’s Happening", detail: "Start with our AI advisor (2 minutes)." },
  { title: "We Assess", detail: "We review your info, photos and needs." },
  { title: "Get a Recommendation", detail: "Receive a clear plan and next steps." },
  { title: "Schedule & Get It Done", detail: "We handle the rest, from start to finish." },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="on-dark relative isolate scroll-mt-16 overflow-hidden bg-brand-strong text-white"
    >
      <RoofPhoto crop="object-[30%_55%] scale-[1.9] origin-[30%_55%] opacity-60" sizes="100vw" className="-z-10" />
      <Container className="max-w-6xl py-16 lg:py-20">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="how-title"
            tone="inverse"
            eyebrow="How it works"
            title="Fast, Simple, Stress-Free"
            description="Getting a new roof or repair is easier than you think."
          />
          <AdvisorButton className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-bright sm:self-auto">
            Get Your Assessment
            <ArrowRight aria-hidden="true" className="size-4" />
          </AdvisorButton>
        </div>

        <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
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
              <h3 className="mt-6 font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-white/70">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
