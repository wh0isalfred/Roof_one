import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export function BeforeAfterSection() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-16 bg-canvas py-8">
      <Container className="max-w-6xl">
        <div className="on-dark grid overflow-hidden rounded-lg bg-brand-strong text-white lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <SectionHeading
              id="projects-title"
              tone="inverse"
              title="Same house. New roof."
              description="Worn, patched shingles and a sagging gutter, replaced in full. Drag the slider to compare."
            />
          </div>
          <BeforeAfterSlider />
        </div>
      </Container>
    </section>
  );
}
