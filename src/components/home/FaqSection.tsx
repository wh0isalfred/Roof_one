import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { SAMPLE_FAQS } from "@/content/sample";

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-canvas py-20 lg:py-28">
      <Container className="max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              id="faq-title"
              title="Questions we get a lot"
              description="If yours isn’t here, ask us. It’s quicker than searching."
            />
            <MoreLink href={siteConfig.phone.href}>Call {siteConfig.phone.display}</MoreLink>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {SAMPLE_FAQS.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-4 text-lg font-semibold transition-colors hover:text-brand">
                  {faq.question}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition-transform group-open:rotate-45 motion-reduce:transition-none">
                    <Plus aria-hidden="true" className="size-4" />
                  </span>
                </summary>
                <p className="-mt-1 max-w-xl pb-6 leading-relaxed text-ink-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
