import { ArrowRight, Clock, LockKeyhole, ShieldCheck } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { Accent, SectionHeading } from "@/components/ui/SectionHeading";

const REASSURANCES = [
  { icon: ShieldCheck, lines: ["Quick", "& Easy"] },
  { icon: Clock, lines: ["Takes Just", "A Few Minutes"] },
  { icon: LockKeyhole, lines: ["Your Info", "Stays Private"] },
] as const;

export function FinalCtaSection() {
  return (
    <section
      id="assessment"
      aria-labelledby="cta-title"
      className="on-dark relative isolate scroll-mt-16 overflow-hidden bg-brand-strong text-white"
    >
      <RoofPhoto crop="object-[70%_20%] opacity-40" sizes="100vw" className="-z-10" />
      <Container className="max-w-6xl">
        <div className="grid gap-12 py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <SectionHeading
              id="cta-title"
              tone="inverse"
              eyebrow="Ready to get started"
              title={
                <>
                  Tell us what’s happening.
                  <br />
                  We’ll help with the <Accent tone="inverse">next step.</Accent>
                </>
              }
            />
            <AdvisorButton className="mt-9 inline-flex h-13 items-center gap-2 rounded-full bg-accent px-7 font-semibold text-white transition-colors hover:bg-accent-strong">
              Start Assessment
              <ArrowRight aria-hidden="true" className="size-4" />
            </AdvisorButton>
          </div>

          <ul className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-white/20 lg:pl-14">
            {REASSURANCES.map(({ icon: Icon, lines }) => (
              <li key={lines.join(" ")} className="flex items-center gap-4">
                <Icon aria-hidden="true" strokeWidth={1.6} className="size-8 shrink-0" />
                <p className="text-sm leading-snug font-medium">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
