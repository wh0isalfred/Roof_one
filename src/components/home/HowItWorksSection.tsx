import { Container } from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "Tell us what's happening",
    description: "Describe your roof issue and we'll ask some clarifying questions.",
  },
  {
    number: "02",
    title: "We review the details",
    description: "Our team analyzes your information and assesses the best path forward.",
  },
  {
    number: "03",
    title: "We contact you",
    description: "A roofing specialist reaches out to discuss options and next steps.",
  },
  {
    number: "04",
    title: "You know the next step",
    description: "Whether it's repair or replacement, you'll have a clear plan.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <Container className="max-w-6xl">
        <div className="mb-16 lg:mb-20">
          <h2 className="text-4xl lg:text-5xl font-semibold text-ink mb-6">
            How it works
          </h2>
          <p className="text-lg text-ink-muted max-w-2xl">
            We've simplified the process. Four steps from assessment to clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-8">
              <div className="flex-shrink-0">
                <div className="text-5xl lg:text-6xl font-bold text-brand-soft">
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-ink-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
