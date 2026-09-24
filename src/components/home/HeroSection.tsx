import { ArrowRight, Phone } from "lucide-react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

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
        <div className="flex min-h-[38rem] flex-col justify-center pt-28 pb-16 sm:min-h-[42rem] lg:min-h-[46rem] lg:pt-32">
          <div className="max-w-2xl animate-[rise_0.8s_ease-out_both] motion-reduce:animate-none">
            <h1 className="text-[2.6rem] leading-[0.98] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
              When your roof needs attention,{" "}
              <span className="text-brand-bright">start here.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              From leaks and storm damage to full replacement, we’ll help you
              figure out the next step.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <AdvisorButton className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 font-semibold text-white transition-colors hover:bg-brand-bright">
                Get My Roof Assessment
                <ArrowRight aria-hidden="true" className="size-4" />
              </AdvisorButton>
              <a
                href={siteConfig.phone.href}
                className="group inline-flex h-13 items-center justify-center gap-3 font-semibold text-white sm:justify-start"
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-white/40 transition-colors group-hover:border-white group-hover:bg-white/10">
                  <Phone aria-hidden="true" className="size-4" />
                </span>
                Call Us
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
