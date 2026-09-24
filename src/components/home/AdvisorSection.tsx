import { Crosshair, ImageUp, MessageSquareShare, Timer } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Accent, SectionHeading } from "@/components/ui/SectionHeading";
import { AdvisorPreview } from "./AdvisorPreview";

const FEATURES = [
  { icon: Timer, title: "Quick & Easy", detail: "(2 minutes)" },
  { icon: ImageUp, title: "Photo Upload", detail: "(Optional)" },
  { icon: Crosshair, title: "Personalized", detail: "Recommendations" },
  { icon: MessageSquareShare, title: "Direct to Our Team", detail: "For Next Steps" },
] as const;

export function AdvisorSection() {
  return (
    <section
      id="advisor"
      aria-labelledby="advisor-title"
      className="scroll-mt-16 bg-brand-soft py-20 lg:py-24"
    >
      <Container className="max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_27rem] lg:gap-20">
          <div>
            <SectionHeading
              id="advisor-title"
              eyebrow="Roofing advisor"
              title={
                <>
                  Not sure what your roof needs?
                  <br />
                  <Accent>Tell us what’s happening.</Accent>
                </>
              }
              description="Our Roofing Advisor will ask a few quick questions, understand your situation, and guide you to the right solution — no guesswork, no hassle."
            />
            <ul className="mt-10 grid max-w-lg gap-x-8 gap-y-7 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-canvas text-brand">
                    <Icon aria-hidden="true" strokeWidth={1.7} className="size-5" />
                  </span>
                  <p className="text-sm leading-snug">
                    <span className="block font-medium">{title}</span>
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
