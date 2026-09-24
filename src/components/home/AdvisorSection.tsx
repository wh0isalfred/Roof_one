import { Camera, ListChecks, PhoneCall, Timer } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Accent, SectionHeading } from "@/components/ui/SectionHeading";
import { AdvisorPreview } from "./AdvisorPreview";

const FEATURES = [
  { icon: Timer, title: "About 2 minutes", detail: "Short questions, plain words" },
  { icon: Camera, title: "Photos if you have them", detail: "From the yard or the attic" },
  { icon: ListChecks, title: "Advice for your roof", detail: "Based on what you tell us" },
  { icon: PhoneCall, title: "A roofer calls you back", detail: "To talk through next steps" },
] as const;

export function AdvisorSection() {
  return (
    <section
      id="advisor"
      aria-labelledby="advisor-title"
      className="scroll-mt-16 bg-brand-soft py-20 lg:py-28"
    >
      <Container className="max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_27rem] lg:gap-20">
          <div>
            <SectionHeading
              id="advisor-title"
              title={
                <>
                  Not sure what’s wrong?{" "}
                  <Accent>Start with what you can see.</Accent>
                </>
              }
              description="A stain on the ceiling. Grit in the gutters. A shingle on the lawn. Answer a few questions about what you’ve noticed and it goes straight to our team."
            />
            <ul className="mt-10 grid max-w-xl gap-x-8 gap-y-7 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-canvas text-brand">
                    <Icon aria-hidden="true" strokeWidth={1.7} className="size-5" />
                  </span>
                  <p className="text-sm leading-snug">
                    <span className="block font-semibold">{title}</span>
                    <span className="text-ink-muted">{detail}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <AdvisorPreview />
        </div>
      </Container>
    </section>
  );
}
