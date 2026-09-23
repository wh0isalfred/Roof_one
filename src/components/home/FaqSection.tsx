"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How do I know if I need a repair or replacement?",
    answer:
      "Our assessment process will help determine whether your roof can be repaired or needs full replacement. Generally, if your roof is less than 10 years old and has localized damage, repair may be sufficient. Older roofs with widespread issues typically benefit from replacement.",
  },
  {
    question: "What happens after I request an assessment?",
    answer:
      "A roofing specialist will contact you within 24 hours to confirm details and schedule an inspection at your convenience. We'll assess your roof, provide a detailed estimate, and answer any questions you have.",
  },
  {
    question: "Can you help with storm damage?",
    answer:
      "Absolutely. We specialize in storm damage assessment and restoration. We'll work with your insurance company and handle the entire claim process for you.",
  },
  {
    question: "Do I need to know the age of my roof?",
    answer:
      "It helps, but it's not required. Our inspection will assess the condition of your roof regardless of age. Most roofs last 20-30 years depending on materials and climate.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28 bg-subtle">
      <Container className="max-w-3xl">
        <div className="mb-16 lg:mb-20">
          <h2 className="text-4xl lg:text-5xl font-semibold text-ink mb-6">
            FAQs
          </h2>
          <p className="text-lg text-ink-muted">
            Common questions about our roofing services.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-line rounded-lg overflow-hidden bg-white"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === idx ? null : idx)
                }
                className="w-full px-6 py-4 lg:px-8 lg:py-5 flex items-center justify-between text-left hover:bg-subtle transition-colors"
              >
                <h3 className="font-semibold text-ink text-lg">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-brand flex-shrink-0 transition-transform ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === idx && (
                <div className="px-6 py-4 lg:px-8 lg:py-5 border-t border-line bg-white">
                  <p className="text-ink-muted leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
