"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RoofingAdvisorModal } from "@/components/roofing-advisor/RoofingAdvisorModal";

export function FinalCtaSection() {
  const [showAdvisor, setShowAdvisor] = useState(false);

  return (
    <>
      <section className="py-20 lg:py-28 bg-brand text-white">
        <Container className="max-w-4xl text-center">
          <h2 className="text-4xl lg:text-6xl font-semibold mb-8 leading-tight">
            Ready to find out what your roof needs?
          </h2>

          <p className="text-lg lg:text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Tell us what&apos;s happening and we&apos;ll help you figure out the next step.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowAdvisor(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white font-semibold rounded-lg hover:bg-accent-strong transition-colors"
            >
              Get My Roof Assessment
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="tel:+15551234567"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              <Phone className="w-5 h-5" />
              Call Us
            </Link>
          </div>
        </Container>
      </section>

      {showAdvisor && (
        <RoofingAdvisorModal onClose={() => setShowAdvisor(false)} />
      )}
    </>
  );
}
