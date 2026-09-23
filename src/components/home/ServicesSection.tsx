"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { ServiceDetail } from "./ServiceDetail";
import { X } from "lucide-react";

const services = [
  {
    id: 1,
    number: "01",
    title: "Roof Repair",
    description: "Fix leaks, missing shingles, and damage without full replacement.",
    details: ["Leak detection and repair", "Shingle replacement", "Flashing repair", "Gutter maintenance"],
  },
  {
    id: 2,
    number: "02",
    title: "Storm Damage",
    description: "Swift assessment and restoration after severe weather.",
    details: ["Insurance claim assistance", "Emergency tarping", "Full damage assessment", "Complete restoration"],
  },
  {
    id: 3,
    number: "03",
    title: "Roof Replacement",
    description: "Complete roof system replacement with quality materials.",
    details: ["Material selection", "Professional installation", "Warranty coverage", "Long-term durability"],
  },
];

export function ServicesSection() {
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);

  return (
    <>
      <section className="py-20 lg:py-28 bg-white">
        <Container className="max-w-6xl">
          <div className="mb-16 lg:mb-20">
            <h2 className="text-4xl lg:text-5xl font-semibold text-ink mb-6">
              Services we offer
            </h2>
            <p className="text-lg text-ink-muted max-w-2xl">
              From emergency repairs to complete replacements, we handle all aspects of residential roofing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="group text-left p-8 bg-white border-2 border-line rounded-xl hover:border-brand hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl font-bold text-brand-soft mb-4">
                  {service.number}
                </div>
                <h3 className="text-2xl font-semibold text-ink mb-3 group-hover:text-brand transition-colors">
                  {service.title}
                </h3>
                <p className="text-ink-muted leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-6 text-brand font-semibold text-sm flex items-center gap-2">
                  Learn more
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetail
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}
