import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { SAMPLE_LEGAL_LINKS, SAMPLE_SOCIAL_LINKS } from "@/content/sample";
import { Logo } from "./Logo";
import { SocialIcon } from "./SocialIcon";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-brand-strong text-white">
      <Container className="max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-[1.4fr_0.9fr_1.3fr_1.3fr] lg:gap-8 lg:py-12">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-white/70">{siteConfig.tagline}</p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid gap-2 text-sm">
              {siteConfig.nav.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <ul className="grid gap-3 text-sm">
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
            <ul className="mt-5 flex gap-3">
              {SAMPLE_SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <SocialIcon name={social.icon} className="size-4" />
                    <span className="sr-only">{social.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 text-sm text-white/65 sm:col-span-1 lg:border-l lg:border-white/15 lg:pl-8">
            <p>
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <ul className="mt-3 flex gap-6">
              {SAMPLE_LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/70 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
