"use client";

import { useState } from "react";
import { X, ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { RoofingAdvisorModal } from "@/components/roofing-advisor/RoofingAdvisorModal";

interface ServiceDetailProps {
  service: {
    id: number;
    number: string;
    title: string;
    description: string;
    details: string[];
  };
  onClose: () => void;
}

export function ServiceDetail({ service, onClose }: ServiceDetailProps) {
  const [showAdvisor, setShowAdvisor] = useState(false);

  if (showAdvisor) {
    return (
      <RoofingAdvisorModal onClose={() => {
        setShowAdvisor(false);
        onClose();
      }} />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:w-full lg:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-line p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-ink">{service.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-subtle rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          <p className="text-lg text-ink-muted mb-8 leading-relaxed">
            {service.description}
          </p>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-ink mb-4">What we help with:</h3>
            <ul className="space-y-3">
              {service.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-brand" />
                  </div>
                  <span className="text-ink">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-line" />

          <p className="text-ink-muted mb-6">
            Not sure what you need?
          </p>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAdvisor(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-strong transition-colors"
            >
              Talk to our Roofing Advisor
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="tel:+15551234567"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-subtle text-ink font-semibold rounded-lg hover:bg-line transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
