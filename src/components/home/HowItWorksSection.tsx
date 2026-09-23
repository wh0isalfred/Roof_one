import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_STEPS } from "@/content/home";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-4"
    >
      <Container className="py-20 lg:py-28">
        <SectionHeading
          id="how-it-works-heading"
          eyebrow="How it works"
          title="From first question to a clear plan."
        />
        <ol className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="bg-canvas p-6 sm:p-8">
              <span
                aria-hidden="true"
                className="font-display text-4xl font-bold text-accent"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-ink-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
