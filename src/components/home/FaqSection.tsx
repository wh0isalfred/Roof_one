import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";

const FAQS = [
  {
    question: "How do I know if I need a repair or a replacement?",
    answer:
      "It depends on the roof’s age, what’s damaged, and how widespread the damage is. The assessment gathers those details so the team can recommend the right next step, and an inspection confirms it.",
  },
  {
    question: "What happens after I request an assessment?",
    answer:
      "A member of the team reviews your answers and contacts you the way you asked — by phone, text or email — to talk through next steps and arrange a visit if one is needed.",
  },
  {
    question: "Can you help with storm damage?",
    answer:
      "Yes. We’ll assess what the storm did to your roof and walk you through the options. We can also note what we find so you have it for your records.",
  },
  {
    question: "Do I need to know the age of my roof?",
    answer:
      "No. A rough guess helps, and “not sure” is a fine answer. The inspection will tell us the rest.",
  },
  {
    question: "Do I have to upload photos?",
    answer:
      "Photos are optional. They help the team prepare, but you can skip that step and still send your request.",
  },
] as const;

export function FaqSection() {
  return (
    <section aria-label="Frequently asked questions" className="bg-surface py-16 lg:py-24">
      <Container className="max-w-3xl">
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-5 text-lg font-semibold">
                {faq.question}
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-brand transition-transform group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="-mt-1 pb-6 leading-relaxed text-ink-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
