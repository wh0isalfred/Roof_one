import { Clock, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { heroPhoto } from "@/assets/photos";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { ButtonArrow, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { SAMPLE_PROOF } from "@/content/sample";

/**
 * Headline on white beside the crew at work. The photo sits first on small
 * screens so the page reads as roofing before the first scroll, and runs to
 * the right edge from lg up.
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative bg-canvas pt-16 lg:pt-20">
      <div
        aria-hidden="true"
        className="relative aspect-[16/10] overflow-hidden bg-brand-strong sm:aspect-[2/1] lg:absolute lg:top-20 lg:right-0 lg:bottom-0 lg:aspect-auto lg:w-[46%]"
      >
        <Image
          src={heroPhoto}
          alt=""
          fill
          preload
          placeholder="blur"
          sizes="(min-width: 1024px) 46vw, 100vw"
          className="animate-[hero-settle_1.6s_ease-out_both] object-cover object-[44%_40%] motion-reduce:animate-none"
        />
      </div>

      <Container className="max-w-6xl">
        <div className="@container flex flex-col justify-center pt-11 pb-16 sm:pt-14 sm:pb-20 lg:min-h-[clamp(36rem,calc(100svh-8rem),50rem)] lg:w-[54%] lg:py-20 lg:pr-14">
          <div className="animate-[rise_0.8s_ease-out_both] motion-reduce:animate-none">
            <h1
              id="hero-title"
              className="font-headline text-display uppercase"
            >
              <span className="block">Secure Your</span>{" "}
              <span className="block">Home With</span>{" "}
              <span className="block">Confidence.</span>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-ink-muted lg:mt-8">
              Professional roofing services, expert advice, and fast, reliable
              support — because your home deserves the best.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <AdvisorButton className={buttonStyles({ size: "xl" })}>
                Start your assessment
                <ButtonArrow />
              </AdvisorButton>
              <a
                href={siteConfig.phone.href}
                className="inline-flex h-12 items-center justify-center gap-3 self-center font-semibold underline-offset-4 hover:underline sm:self-auto"
              >
                <Phone aria-hidden="true" className="size-4 text-brand" />
                {siteConfig.phone.display}
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-7 lg:mt-14">
              <div className="flex items-center gap-4">
                <ul aria-hidden="true" className="flex -space-x-2.5">
                  {SAMPLE_PROOF.photos.map((photo) => (
                    <li key={photo.src} className="size-9 overflow-hidden rounded-full border-2 border-canvas">
                      <Image src={photo} alt="" sizes="36px" className="size-full object-cover object-[50%_30%]" />
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-tight">
                  <span className="block font-semibold">{SAMPLE_PROOF.headline}</span>
                  <span className="text-ink-muted">{SAMPLE_PROOF.detail}</span>
                </p>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
                <li className="flex items-center gap-2">
                  <Clock aria-hidden="true" className="size-4 text-brand" />
                  About 2 minutes
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck aria-hidden="true" className="size-4 text-brand" />
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
