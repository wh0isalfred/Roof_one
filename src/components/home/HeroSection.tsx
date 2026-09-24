"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RoofingAdvisorModal } from "@/components/roofing-advisor/RoofingAdvisorModal";
import Hero from "@/assets/heroImage.jpg";

export function HeroSection() {
  const [showAdvisor, setShowAdvisor] = useState(false);

  return (
    <>
      <section className="relative min-h-screen bg-white pt-32 pb-0 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${Hero})`,
              backgroundPosition: 'center 40%',
            }}
          />
          {/* Dark gradient overlay from left to right */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-strong via-brand-strong/70 to-transparent" />
        </div>

        {/* Content */}
        <Container className="relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-128px)]">
            {/* Left column: text */}
            <div className="text-white">
              <h1 className="font-display font-semibold text-5xl lg:text-7xl leading-tight mb-8">
                When your roof needs attention, start here.
              </h1>

              <p className="text-lg text-white/90 mb-8 max-w-md leading-relaxed">
                From leaks and storm damage to full replacement, start with a simple assessment and let our team help you figure out the next step.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => setShowAdvisor(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent-strong transition-colors"
                >
                  Get My Roof Assessment
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="tel:+15551234567"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-strong font-semibold rounded-lg hover:bg-brand-soft transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Us
                </Link>
              </div>

              {/* Trust indicator */}
              <div className="flex items-center gap-2 text-white/75 text-sm">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-accent border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <span>2,400+ homes protected</span>
              </div>
            </div>

            {/* Right column: spacer for image area */}
            <div className="hidden lg:block" />
          </div>
        </Container>
      </section>

      {/* Roofing Advisor Modal */}
      {showAdvisor && (
        <RoofingAdvisorModal onClose={() => setShowAdvisor(false)} />
      )}
    </>
  );
}
