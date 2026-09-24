import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { SAMPLE_FAQS } from "@/content/sample";

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-surface py-20 sm:py-24 lg:py-28">
      <Container className="max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)] lg:gap-20">
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
                <summary className="flex min-h-18 cursor-pointer items-center justify-between gap-6 py-5 text-lg leading-snug font-semibold transition-colors hover:text-brand sm:text-xl">
                  {faq.question}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-brand transition-[rotate,background-color,border-color,color] duration-200 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-white motion-reduce:transition-none">
                    <Plus aria-hidden="true" className="size-4" />
                  </span>
                </summary>
                <p className="-mt-1 max-w-xl pb-7 text-lg leading-relaxed text-ink-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
