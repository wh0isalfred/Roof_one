import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export function BeforeAfterSection() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="scroll-mt-16 bg-canvas pb-20 sm:pb-24 lg:pb-28"
    >
      <Container className="max-w-6xl">
        <div className="grid gap-6 border-t border-line pt-20 sm:pt-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-20 lg:pt-28">
          <SectionHeading id="projects-title" title="Same house. New roof." />
          <p className="max-w-lg text-lg leading-relaxed text-ink-muted">
            Worn, patched shingles and a sagging gutter, replaced in full. Drag
            the slider to compare.
          </p>
        </div>
        <BeforeAfterSlider className="mt-12 lg:mt-16" />
      </Container>
    </section>
  );
}
