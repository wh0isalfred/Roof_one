import type { Route } from "next";

export interface NavLink {
  label: string;
  href: Route;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  phone: {
    display: string;
    href: `tel:${string}`;
  };
  email: {
    display: string;
    href: `mailto:${string}`;
  };
  nav: {
    links: readonly NavLink[];
    cta: NavLink;
  };
}

export const siteConfig: SiteConfig = {
  // Placeholder brand name. Replace with the company's real name.
  name: "Roof One",
  tagline: "Stronger roofs. Safer homes.",
  description:
    "Roof repair, replacement, and inspections. Tell us what’s going on with your roof and our team will follow up.",
  // Placeholder from the reserved fictional 555-01xx range. Replace before launch.
  phone: {
    display: "(555) 555-0100",
    href: "tel:+15555550100",
  },
  // Placeholder on the reserved example.com domain. Replace before launch.
  email: {
    display: "hello@example.com",
    href: "mailto:hello@example.com",
  },
  nav: {
    links: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/#services" },
      { label: "Projects", href: "/#projects" },
      { label: "About", href: "/#how-it-works" },
      { label: "FAQs", href: "/#faq" },
    ],
    cta: { label: "Get Assessment", href: "/#assessment" },
  },
};
