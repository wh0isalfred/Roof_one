import type { Metadata } from "next";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "FAQs",
};

export default function FaqsPage() {
  return (
    <>
      <div className="on-dark bg-brand-strong text-white">
        <Container className="max-w-6xl pt-36 pb-16 lg:pt-44 lg:pb-20">
          <Eyebrow tone="inverse">FAQs</Eyebrow>
          <h1 className="mt-5 text-4xl leading-none font-bold tracking-tight uppercase sm:text-5xl lg:text-6xl">
            Questions homeowners ask us
          </h1>
        </Container>
      </div>
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
