import { ArrowRight, Clock, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { SAMPLE_PROOF } from "@/content/sample";

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
        <div className="flex min-h-[40rem] flex-col justify-center pt-28 pb-14 lg:min-h-[44rem] lg:pt-32">
          <div className="max-w-[54rem] animate-[rise_0.8s_ease-out_both] motion-reduce:animate-none">
            <h1 className="font-headline text-[2.5rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem]">
              Know what your roof needs{" "}
              <span className="text-brand-bright">before you pay for it.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/85">
              Tell us what you’re seeing and add a few photos. A roofer looks it
              over and calls you back with a straight answer: repair it, replace
              it, or leave it for now.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <AdvisorButton className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 font-semibold text-white transition-colors hover:bg-brand-bright">
                Get a roof assessment
                <ArrowRight aria-hidden="true" className="size-4" />
              </AdvisorButton>
              <a
                href={siteConfig.phone.href}
                className="inline-flex h-13 items-center justify-center gap-3 rounded-full border border-white/35 pr-6 pl-2 font-semibold transition-colors hover:border-white hover:bg-white/10"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-brand-strong">
                  <Phone aria-hidden="true" className="size-4" />
                </span>
                {siteConfig.phone.display}
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-white/15 pt-7">
              <div className="flex items-center gap-4">
                <ul aria-hidden="true" className="flex -space-x-3">
                  {SAMPLE_PROOF.photos.map((photo) => (
                    <li key={photo.src} className="size-10 overflow-hidden rounded-full border-2 border-brand-strong">
                      <Image src={photo} alt="" sizes="40px" className="size-full object-cover object-[50%_30%]" />
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-tight">
                  <span className="block font-semibold">{SAMPLE_PROOF.headline}</span>
                  <span className="text-white/65">{SAMPLE_PROOF.detail}</span>
                </p>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <Clock aria-hidden="true" className="size-4" />
                  About 2 minutes
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  No obligation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
