import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AssessmentEntry } from "./AssessmentEntry";

export function IssueSelectorSection() {
  return (
    <section
      id="assessment"
      aria-labelledby="assessment-heading"
      className="scroll-mt-4"
    >
      <Container className="py-20 lg:py-28">
        <SectionHeading
          id="assessment-heading"
          eyebrow="Start here"
          title="What’s going on with your roof?"
          description="Pick the closest match to start your assessment. You can change it later."
        />
        <div className="mt-10">
          <AssessmentEntry />
        </div>
      </Container>
    </section>
  );
}
