import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { SAMPLE_FAQS } from "@/content/sample";

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-canvas py-20 lg:py-24">
      <Container className="max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              id="faq-title"
              eyebrow="Frequently asked questions"
              title="Got Questions? We’ve Got Answers."
              description="Find answers to the most common questions about our services, process, and roofing in general."
            />
            <MoreLink href="/#faq">View All FAQs</MoreLink>
          </div>

          <div className="grid gap-3">
            {SAMPLE_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-md border border-line bg-canvas transition-colors open:border-brand-light open:bg-brand-soft"
              >
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-6 px-5 py-3 text-sm font-medium">
                  {faq.question}
                  <Plus
                    aria-hidden="true"
                    className="size-4 shrink-0 text-brand transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
