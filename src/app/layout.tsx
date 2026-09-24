import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Roof Repair & Replacement`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: "#f5f2ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Smooth-scroll in-page anchors, but keep route changes instant.
      data-scroll-behavior="smooth"
      className={bodyFont.variable}
    >
      <body>
        <a
          href="#main"
          className="sr-only rounded-md bg-ink px-4 py-3 text-sm font-semibold text-canvas focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
