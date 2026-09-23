import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQS } from "@/content/home";

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-4 border-t border-line"
    >
      <Container className="grid gap-12 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-28">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQs"
          title="Common questions."
          className="lg:sticky lg:top-10 lg:self-start"
        />
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-lg font-medium">
                {faq.question}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-accent group-open:rotate-45"
                />
              </summary>
              <p className="max-w-2xl pb-6 text-ink-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
