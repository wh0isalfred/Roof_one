import { Clock, House, MessageSquareText, ShieldCheck } from "lucide-react";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const POINTS = [
  { icon: ShieldCheck, label: "Trusted Professionals" },
  { icon: House, label: "Premium Materials" },
  { icon: Clock, label: "Fast & Reliable Service" },
  { icon: MessageSquareText, label: "Honest Recommendations" },
] as const;

export function TrustSection() {
  return (
    <section
      id="why-roof-one"
      aria-labelledby="why-title"
      className="scroll-mt-16 overflow-hidden bg-brand-soft"
    >
      <Container className="max-w-6xl">
        <div className="grid items-center gap-12 py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-24">
          <div>
            <SectionHeading
              id="why-title"
              eyebrow="Why Roof One"
              title={
                <>
                  Experts you can trust.
                  <br />
                  Quality you can see.
                </>
              }
              description="We combine experience, premium materials and honest guidance to give you the right solution — not just a quick fix."
            />
            <ul className="mt-10 grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {POINTS.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className={
                    index > 0
                      ? "border-brand-light sm:border-l sm:pl-5"
                      : "sm:pr-5"
                  }
                >
                  <Icon aria-hidden="true" strokeWidth={1.6} className="size-8 text-brand" />
                  <p className="mt-4 text-sm leading-snug font-semibold">{label}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="on-dark relative isolate aspect-[4/3] overflow-hidden rounded-md text-white lg:aspect-auto lg:h-[26rem]">
            <RoofPhoto
              tone="soft"
              crop="object-[30%_55%] scale-[1.9] origin-[30%_55%]"
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="-z-10"
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-1/4 bg-brand [clip-path:polygon(100%_0,100%_100%,0_100%,65%_0)]"
            />
            <p className="absolute right-0 bottom-0 bg-brand-strong px-6 py-5 text-xl leading-tight font-bold tracking-tight uppercase sm:text-2xl">
              Built for
              <br />
              longer.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
