import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { PrimaryNav } from "./PrimaryNav";

/**
 * Floating header: wordmark on the left, a compact link bar in the middle and
 * the assessment CTA on the right. It sits over the hero.
 */
export function SiteHeader() {
  const { links, cta } = siteConfig.nav;

  return (
    <header className="on-dark absolute inset-x-0 top-0 z-40">
      <Container className="relative flex h-20 items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Logo className="text-canvas" />
        <PrimaryNav links={links} className="hidden lg:block" />
        <div className="flex items-center justify-end">
          <Link
            href={cta.href}
            className="hidden h-12 items-center gap-3 rounded-full bg-surface pr-1.5 pl-5 text-sm font-semibold text-ink transition-colors hover:bg-white lg:inline-flex"
          >
            {cta.label}
            <span className="flex size-9 items-center justify-center rounded-full bg-ink text-canvas">
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
          </Link>
          <MobileMenu
            links={links}
            cta={cta}
            phone={siteConfig.phone}
            className="lg:hidden"
          />
        </div>
      </Container>
    </header>
  );
}
