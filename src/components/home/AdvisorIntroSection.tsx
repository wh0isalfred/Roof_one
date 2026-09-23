import { ArrowRight, Camera, ListChecks, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const POINTS = [
  {
    icon: ListChecks,
    title: "A few quick questions",
    description:
      "About the problem, the roof, and the property. It takes a few minutes.",
  },
  {
    icon: Camera,
    title: "Photos from your phone",
    description:
      "Optional, but photos help the team understand the problem before calling.",
  },
  {
    icon: UserRound,
    title: "A person follows up",
    description:
      "Your request goes to our team, who reach out the way you prefer.",
  },
];

export function AdvisorIntroSection() {
  return (
    <section
      aria-labelledby="advisor-heading"
      className="border-y border-line bg-surface"
    >
      <Container className="grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
        <div>
          <SectionHeading
            id="advisor-heading"
            eyebrow="Roofing Advisor"
            title="Not sure what you need? Start with a few questions."
            description="The Roofing Advisor walks you through what’s going on, one question at a time. When you’re done, everything goes to our team, so the first conversation starts with the details."
          />
          <ButtonLink href="/#assessment" className="mt-8">
            Start the assessment
            <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {POINTS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-5 py-6">
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-6 shrink-0 text-accent"
              />
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-ink-muted">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
