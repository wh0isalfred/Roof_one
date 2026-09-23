import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-ink text-canvas">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo className="text-canvas" />
            <p className="mt-4 max-w-sm text-sm text-on-brand-muted">
              {siteConfig.description}
            </p>
          </div>

          <nav aria-labelledby="footer-explore-heading">
            <h2
              id="footer-explore-heading"
              className="text-xs font-semibold tracking-eyebrow text-on-brand-muted uppercase"
            >
              Explore
            </h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {siteConfig.nav.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold tracking-eyebrow text-on-brand-muted uppercase">
              Contact
            </h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li>
                <a href={siteConfig.phone.href} className="hover:underline">
                  {siteConfig.phone.display}
                </a>
              </li>
              <li>
                <Link href={siteConfig.nav.cta.href} className="hover:underline">
                  {siteConfig.nav.cta.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-brand-strong pt-6 text-sm text-on-brand-muted">
          © {year} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}
