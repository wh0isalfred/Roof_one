import type { Viewport } from "next";
import { AdvisorProvider } from "@/components/roofing-advisor/AdvisorDialog";
import { AdvisorLauncher } from "@/components/roofing-advisor/AdvisorLauncher";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const viewport: Viewport = {
  themeColor: "#062B63",
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <AdvisorProvider>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <AdvisorLauncher />
    </AdvisorProvider>
  );
}
