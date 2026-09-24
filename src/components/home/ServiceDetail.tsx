"use client";

import { ArrowRight, Check, Phone, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useOpenAdvisor } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { siteConfig } from "@/config/site";
import type { Service } from "./services";

/** Details for one service, with a route into the Roofing Advisor. */
export function ServiceDetail({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openAdvisor = useOpenAdvisor();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (service && dialog && !dialog.open) dialog.showModal();
  }, [service]);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="service-detail-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="dialog-panel on-light m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-lg bg-canvas text-ink sm:m-auto sm:w-[calc(100%-3rem)] sm:max-w-2xl sm:rounded-lg sm:shadow-overlay"
    >
      {service && (
        <>
          <div className="on-dark relative isolate flex h-44 items-end px-6 pb-6 text-white sm:h-52 sm:px-8">
            <RoofPhoto crop={service.crop} sizes="(min-width: 640px) 42rem, 100vw" className="-z-10" />
            <h2
              id="service-detail-title"
              className="text-3xl font-bold tracking-tight uppercase"
            >
              {service.title}
            </h2>
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-md transition-colors hover:bg-white/10"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <p className="text-lg leading-relaxed text-ink-muted">{service.summary}</p>

            <h3 className="mt-8 text-xs font-semibold tracking-eyebrow text-brand uppercase">
              What we help with
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.helpsWith.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-line pt-7">
              <p className="font-semibold">Not sure what you need?</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    close();
                    openAdvisor(service.issue);
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-strong"
                >
                  Talk to our Roofing Advisor
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
                <a
                  href={siteConfig.phone.href}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-control px-6 font-semibold transition-colors hover:bg-subtle"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
