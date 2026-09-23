import { ISSUE_ICONS } from "@/components/issue-icons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SERVICES } from "@/content/home";

export function ServicesSection() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-4 border-t border-line"
    >
      <Container className="grid gap-12 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-28">
        <SectionHeading
          id="services-heading"
          eyebrow="Services"
          title="Repairs, replacements, and inspections."
          description="Whatever is going on, the assessment is the place to start."
          className="lg:sticky lg:top-10 lg:self-start"
        />
        <ul className="divide-y divide-line border-y border-line">
          {SERVICES.map((service) => {
            const Icon = ISSUE_ICONS[service.issue];
            return (
              <li key={service.issue} className="flex gap-5 py-7">
                <Icon
                  aria-hidden="true"
                  className="mt-1 size-6 shrink-0 text-accent"
                />
                <div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="mt-2 text-ink-muted">{service.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
