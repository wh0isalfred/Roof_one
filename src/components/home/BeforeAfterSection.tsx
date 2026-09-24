import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export function BeforeAfterSection() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-16 bg-canvas py-8">
      <Container className="max-w-6xl">
        <div className="on-dark grid overflow-hidden rounded-lg bg-brand-strong text-white lg:grid-cols-[1fr_1.05fr]">
          <div className="p-8 sm:p-10 lg:py-12">
            <SectionHeading
              id="projects-title"
              tone="inverse"
              eyebrow="Before & after"
              title="Real Results. Lasting Protection."
              description="See the difference a quality roof can make."
              className="[&_h2]:text-3xl [&_h2]:lg:text-[2.1rem]"
            />
            <div className="[&_a]:text-brand-bright">
              <MoreLink href="/#projects">View More Projects</MoreLink>
            </div>
          </div>
          <BeforeAfterSlider />
        </div>
      </Container>
    </section>
  );
}
