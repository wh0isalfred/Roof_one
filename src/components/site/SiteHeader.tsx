"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdvisorButton } from "@/components/roofing-advisor/AdvisorDialog";
import { ButtonArrow, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

/** Solid deep blue over every page. From lg up it tightens once the page scrolls. */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { links, cta } = siteConfig.nav;

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const compact = scrolled || menuOpen;

  return (
    <header className="on-dark fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-brand-strong text-white">
      <Container className="max-w-6xl">
        <div
          className={cn(
            "flex h-16 items-center justify-between gap-6 transition-[height] duration-300 motion-reduce:transition-none",
            !compact && "lg:h-20",
          )}
        >
          <Logo />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-2">
              {links.map((link) => {
                const current = link.href === pathname;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={current ? "page" : undefined}
                      className="relative flex h-10 items-center px-3 text-sm font-medium text-white/85 transition-colors hover:text-white aria-[current=page]:text-white"
                    >
                      {link.label}
                      {current && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 -bottom-1 h-0.5 bg-brand-bright"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <AdvisorButton className={buttonStyles({ className: "max-sm:hidden" })}>
              {cta.label}
              <ButtonArrow />
            </AdvisorButton>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-white/10 lg:hidden"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="size-6" />
              ) : (
                <Menu aria-hidden="true" className="size-6" />
              )}
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="border-t border-white/10 bg-brand-strong lg:hidden"
      >
        <Container className="max-w-6xl py-4">
          <nav aria-label="Mobile">
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={link.href === pathname ? "page" : undefined}
                    className="flex h-12 items-center border-b border-white/10 text-lg font-medium aria-[current=page]:text-brand-bright"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-5 grid gap-3 pb-2">
            <AdvisorButton
              onOpen={() => setMenuOpen(false)}
              className={buttonStyles({ size: "lg" })}
            >
              Start your assessment
              <ButtonArrow />
            </AdvisorButton>
            <a
              href={siteConfig.phone.href}
              className={buttonStyles({ variant: "inverse-outline", size: "lg" })}
            >
              <Phone aria-hidden="true" className="size-4" />
              Call {siteConfig.phone.display}
            </a>
          </div>
        </Container>
      </div>
    </header>
  );
}
