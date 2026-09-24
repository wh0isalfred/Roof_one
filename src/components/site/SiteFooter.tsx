import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-ink text-white">
      <Container className="max-w-6xl">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.2fr] lg:gap-8 lg:py-16">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-white/60">{siteConfig.tagline}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid gap-2.5 text-sm">
              {siteConfig.nav.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="grid content-start gap-3 text-sm">
            <li>
              <a
                href={siteConfig.phone.href}
                className="inline-flex items-center gap-3 text-white/70 transition-colors hover:text-white"
              >
                <Phone aria-hidden="true" className="size-4 text-brand-bright" />
                {siteConfig.phone.display}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.email.href}
                className="inline-flex items-center gap-3 text-white/70 transition-colors hover:text-white"
              >
                <Mail aria-hidden="true" className="size-4 text-brand-bright" />
                {siteConfig.email.display}
              </a>
            </li>
          </ul>

          <p className="text-sm text-white/50 lg:border-l lg:border-white/15 lg:pl-8">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
