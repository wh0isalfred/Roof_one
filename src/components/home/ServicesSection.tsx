"use client";

import { useState } from "react";
import { ISSUE_ICONS } from "@/components/issue-icons";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceDetail } from "./ServiceDetail";
import { SERVICES, type Service } from "./services";

const CARD_ORDER = ["roof-repair", "roof-replacement", "storm-damage", "inspections"];
const CARDS = CARD_ORDER.flatMap((id) => SERVICES.filter((service) => service.id === id));

export function ServicesSection() {
  const [selected, setSelected] = useState<Service | null>(null);

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="scroll-mt-16 bg-canvas py-20 lg:py-24"
    >
      <Container className="max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              id="services-title"
              title="What we work on"
              description="Most calls are about one of these four. If yours isn’t, call anyway. We’ll tell you if it’s something we do."
            />
            <MoreLink href={siteConfig.phone.href}>Call {siteConfig.phone.display}</MoreLink>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:gap-5">
            {CARDS.map((service) => {
              const Icon = ISSUE_ICONS[service.issue];
              return (
                <li key={service.id}>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setSelected(service)}
                    className="group h-full w-full rounded-lg border border-line bg-canvas p-4 text-left sm:p-6 transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:border-brand-light hover:shadow-overlay motion-reduce:transition-none"
                  >
                    <Icon aria-hidden="true" strokeWidth={1.7} className="size-8 text-brand" />
                    <h3 className="mt-5 text-lg font-semibold transition-colors group-hover:text-brand">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {service.blurb}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>

      <ServiceDetail service={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
