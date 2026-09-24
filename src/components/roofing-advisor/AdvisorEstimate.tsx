import { Check } from "lucide-react";
import type { EstimateResult } from "@/lib/roofing-advisor/types";

const CONFIDENCE: Record<EstimateResult["confidence"], string> = {
  low: "A rough range from a few details",
  medium: "Based on what you've shared",
  high: "Based on your roof's size and material",
};

/** The preliminary range. The numbers come from the pricing engine, never the AI. */
export function AdvisorEstimate({ estimate }: { estimate: EstimateResult }) {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: estimate.currency,
    maximumFractionDigits: 0,
  });

  return (
    <section aria-label="Preliminary range" className="overflow-hidden rounded-lg border border-brand bg-brand-soft">
      <p className="bg-brand-strong px-4 py-2.5 text-xs font-bold tracking-eyebrow text-on-brand-muted uppercase">
        Preliminary range
      </p>
      <div className="p-4 sm:p-5">
        <p className="font-headline text-3xl text-brand-strong sm:text-4xl">
          {money.format(estimate.low)} – {money.format(estimate.high)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{CONFIDENCE[estimate.confidence]}</p>
        <ul className="mt-4 grid gap-1.5 border-t border-brand-light pt-3 text-sm">
          {estimate.assumptions.map((assumption) => (
            <li key={assumption} className="flex gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
              {assumption}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-5 text-ink-muted">
          A planning range, not a quote. The team confirms pricing after seeing the roof.
        </p>
      </div>
    </section>
  );
}
