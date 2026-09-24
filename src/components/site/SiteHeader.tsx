import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-6">
      <Container className="max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo className="text-ink" />
          </Link>

          {/* Navigation Pill */}
          <nav className="hidden lg:flex items-center gap-1 bg-white rounded-full px-2 py-2 border border-line shadow-lg">
            <Link
              href="/"
              className="px-4 py-2 rounded-full text-sm font-medium text-ink hover:bg-subtle transition-colors"
            >
              Home
            </Link>
            <Link
              href="#services"
              className="px-4 py-2 rounded-full text-sm font-medium text-ink hover:bg-subtle transition-colors"
            >
              Services
            </Link>
            <Link
              href="#projects"
              className="px-4 py-2 rounded-full text-sm font-medium text-ink hover:bg-subtle transition-colors"
            >
              Projects
            </Link>
            <Link
              href="#faqs"
              className="px-4 py-2 rounded-full text-sm font-medium text-ink hover:bg-subtle transition-colors"
            >
              FAQs
            </Link>
          </nav>

          {/* CTA Button */}
          <Link
            href="tel:+15551234567"
            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-ink text-white font-medium rounded-full hover:bg-brand transition-colors"
          >
            Call Us
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          {/* Mobile menu button (placeholder) */}
          <button className="lg:hidden p-2 hover:bg-subtle rounded-lg transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </Container>
    </header>
  );
}
