"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
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
      className="scroll-mt-16 bg-canvas py-20 sm:py-24 lg:py-28"
    >
      <Container className="max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-20">
          <SectionHeading id="services-title" title="What we work on" />
          <div>
            <p className="max-w-lg text-lg leading-relaxed text-ink-muted">
              Most calls are about one of these four. If yours isn’t, call anyway.
              We’ll tell you if it’s something we do.
            </p>
            <MoreLink href={siteConfig.phone.href}>Call {siteConfig.phone.display}</MoreLink>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-16 lg:grid-cols-4">
          {CARDS.map((service) => (
            <li key={service.id} className="group relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-brand-strong">
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none">
                  <Image
                    src={service.photo}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1024px) 17rem, (min-width: 640px) 45vw, 50vw"
                    className={cn("object-cover", service.tileCrop)}
                  />
                </div>
              </div>
              <h3 className="mt-5 flex items-start justify-between gap-3 text-lg leading-snug font-semibold sm:text-xl">
                {/* The button's ::after stretches over the whole tile, photo included. */}
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setSelected(service)}
                  className="text-left transition-colors group-hover:text-brand after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink"
                >
                  {service.title}
                </button>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-ink-muted transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand motion-reduce:transition-none"
                />
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
                {service.blurb}
              </p>
            </li>
          ))}
        </ul>
      </Container>

      <ServiceDetail service={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
