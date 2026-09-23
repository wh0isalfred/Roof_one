"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import type { NavLink, SiteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

interface MobileMenuProps {
  links: readonly NavLink[];
  cta: NavLink;
  phone: SiteConfig["phone"];
  className?: string;
}

/** Small-screen navigation: a menu button that opens a panel under the header. */
export function MobileMenu({ links, cta, phone, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex size-11 items-center justify-center rounded-full bg-surface text-ink"
      >
        {isOpen ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
      </button>

      <div
        id="mobile-menu"
        hidden={!isOpen}
        className="on-light absolute inset-x-4 top-full rounded-lg border border-line bg-surface p-2 shadow-overlay sm:inset-x-6"
      >
        <nav aria-label="Main">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  aria-current={link.href === pathname ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center rounded-md px-3 text-base font-medium hover:bg-subtle",
                    link.href === pathname ? "text-accent" : "text-ink",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-2 grid gap-2 border-t border-line px-1 pt-3 pb-1">
          <ButtonLink href={cta.href} onClick={close} variant="accent" size="lg">
            {cta.label}
          </ButtonLink>
          <a
            href={phone.href}
            className={buttonStyles({ variant: "outline", size: "lg" })}
          >
            <Phone aria-hidden="true" className="size-4" />
            Call {phone.display}
          </a>
        </div>
      </div>
    </div>
  );
}
