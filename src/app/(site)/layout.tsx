import type { Viewport } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

// Matches the hero so the mobile browser chrome blends into the page.
export const viewport: Viewport = {
  themeColor: "#2e4a3e",
};

/** Public marketing site. Kept separate from the internal admin under /admin. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
