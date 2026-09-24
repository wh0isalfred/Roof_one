"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { Container } from "@/components/ui/Container";
import { Accent, SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { ServiceDetail } from "./ServiceDetail";
import { SERVICES, type Service } from "./services";

export function ServicesSection() {
  const [selected, setSelected] = useState<Service | null>(null);
  const [storm, repair, replacement] = SERVICES;

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="scroll-mt-16 bg-surface py-20 lg:py-28"
    >
      <Container className="max-w-6xl">
        <SectionHeading
          id="services-title"
          eyebrow="Our services"
          className="max-w-5xl"
          title={
            <>
              The right next step starts with knowing{" "}
              <br className="hidden lg:block" />
              <Accent>what your roof actually needs.</Accent>
            </>
          }
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:gap-6">
          <ServiceCard service={storm} onSelect={setSelected} />
          <ServiceCard service={repair} onSelect={setSelected} />
          <ServiceCard service={replacement} onSelect={setSelected} featured />
        </div>
      </Container>

      <ServiceDetail service={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function ServiceCard({
  service,
  onSelect,
  featured = false,
}: {
  service: Service;
  onSelect: (service: Service) => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => onSelect(service)}
      className={cn(
        "group on-dark relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-md p-6 text-left text-white sm:p-8",
        featured ? "sm:col-span-2 lg:min-h-[21rem]" : "lg:min-h-[21rem]",
      )}
    >
      <RoofPhoto
        crop={service.crop}
        sizes={featured ? "(min-width: 1152px) 72rem, 100vw" : "(min-width: 640px) 50vw, 100vw"}
        className="-z-10 transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
      />
      <h3 className="text-2xl font-bold tracking-tight uppercase sm:text-[1.7rem]">
        {service.title}
      </h3>
      <p className="mt-3 max-w-sm leading-relaxed text-white/85">{service.summary}</p>
      <span className="mt-6 inline-flex items-center gap-2 font-semibold text-brand-bright">
        Explore
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
        />
      </span>
    </button>
  );
}
