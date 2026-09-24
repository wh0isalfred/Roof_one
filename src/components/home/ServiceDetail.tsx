"use client";

import { Check, Phone, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useOpenAdvisor } from "@/components/roofing-advisor/AdvisorDialog";
import { RoofPhoto } from "@/components/site/RoofPhoto";
import { ButtonArrow, buttonStyles } from "@/components/ui/Button";
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
      className="dialog-panel on-light m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-md bg-canvas text-ink sm:m-auto sm:w-[calc(100%-3rem)] sm:max-w-2xl sm:rounded-md sm:shadow-overlay"
    >
      {service && (
        <>
          <div className="on-dark relative isolate flex h-44 items-end px-6 pb-6 text-white sm:h-52 sm:px-8">
            <RoofPhoto src={service.photo} crop={service.crop} sizes="(min-width: 640px) 42rem, 100vw" className="-z-10" />
            <h2
              id="service-detail-title"
              className="font-headline text-3xl sm:text-4xl"
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

            <h3 className="mt-8 text-lg font-semibold">What this covers</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.helpsWith.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-line pt-7">
              <p className="font-semibold">Not sure this is your problem?</p>
              <p className="mt-1 text-sm text-ink-muted">Describe what you’re seeing and we’ll work it out.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    close();
                    openAdvisor(service.issue);
                  }}
                  className={buttonStyles({ size: "lg" })}
                >
                  Start your assessment
                  <ButtonArrow />
                </button>
                <a
                  href={siteConfig.phone.href}
                  className={buttonStyles({ variant: "outline", size: "lg" })}
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
