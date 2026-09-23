import type { Route } from "next";

export interface NavLink {
  label: string;
  href: Route;
}

export interface SiteConfig {
  name: string;
  description: string;
  phone: {
    display: string;
    href: `tel:${string}`;
  };
  nav: {
    links: readonly NavLink[];
    cta: NavLink;
  };
}

export const siteConfig: SiteConfig = {
  // Placeholder brand name. Replace with the company's real name.
  name: "Roof One",
  description:
    "Roof repair, replacement, and inspections. Tell us what’s going on with your roof and our team will follow up.",
  // Placeholder from the reserved fictional 555-01xx range. Replace before launch.
  phone: {
    display: "(555) 555-0100",
    href: "tel:+15555550100",
  },
  nav: {
    links: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/#services" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Projects", href: "/#projects" },
      { label: "FAQs", href: "/#faq" },
    ],
    cta: { label: "Get an Assessment", href: "/#assessment" },
  },
};
