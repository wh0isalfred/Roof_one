import { ArrowRight, Clock, Phone, Plus, ShieldCheck } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { SAMPLE_PROOF } from "@/content/sample";

const AVATAR_TONES = ["bg-brand", "bg-brand-bright", "bg-on-brand-muted"] as const;

export function HeroSection() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-brand-strong text-white">
      <RoofPhoto
        priority
        sizes="100vw"
        crop="object-[60%_30%] scale-105 animate-[hero-settle_1.6s_ease-out_both] motion-reduce:animate-none"
        className="-z-10"
      />
      <Container className="max-w-6xl">
        <div className="flex min-h-[40rem] flex-col justify-center pt-28 pb-14 lg:min-h-[42rem] lg:pt-32">
          <div className="max-w-xl animate-[rise_0.8s_ease-out_both] motion-reduce:animate-none">
            <Eyebrow tone="inverse">Trusted roofing experts</Eyebrow>
            <h1 className="mt-5 text-[2.75rem] leading-[1.04] font-semibold tracking-tight sm:text-6xl lg:text-[4.1rem]">
              Secure Your Home
              <br />
              <span className="text-brand-bright">With Confidence.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              Professional roofing services, expert advice, and fast, reliable
              support — because your home deserves the best.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <AdvisorButton className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 font-semibold text-white transition-colors hover:bg-brand-bright">
                Get Your Roof Assessment
                <ArrowRight aria-hidden="true" className="size-4" />
              </AdvisorButton>
              <a
                href={siteConfig.phone.href}
                className="group inline-flex h-13 items-center justify-center gap-3 rounded-full border border-white/35 pr-6 pl-2 font-semibold transition-colors hover:border-white hover:bg-white/10"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-brand-strong">
                  <Phone aria-hidden="true" className="size-4" />
                </span>
                Call Us
              </a>
            </div>

            <div className="mt-9 flex items-center gap-4">
              <ul aria-hidden="true" className="flex -space-x-3">
                {SAMPLE_PROOF.initials.map((initials, index) => (
                  <li
                    key={initials}
                    className={`flex size-11 items-center justify-center rounded-full border-2 border-brand-strong text-xs font-bold text-white ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                  >
                    {initials}
                  </li>
                ))}
                <li className="flex size-11 items-center justify-center rounded-full border-2 border-brand-strong bg-brand text-white">
                  <Plus className="size-5" />
                </li>
              </ul>
              <p className="text-sm leading-tight">
                <span className="block font-semibold">{SAMPLE_PROOF.headline}</span>
                <span className="text-white/65">{SAMPLE_PROOF.detail}</span>
              </p>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/85">
              <li className="flex items-center gap-2">
                <Clock aria-hidden="true" className="size-4" />
                Takes about 2 minutes
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4" />
                No obligation
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
