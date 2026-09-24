"use client";

import { MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { AdvisorButton } from "./AdvisorDialog";

/** Compact floating entry to the Roofing Advisor, shown once the hero is out of view. */
export function AdvisorLauncher() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 560);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className={cn(
        "on-dark fixed right-4 bottom-4 z-30 transition-[opacity,translate] duration-300 motion-reduce:transition-none sm:right-6 sm:bottom-6",
        visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      inert={!visible}
    >
      <AdvisorButton className="inline-flex h-12 items-center gap-2.5 rounded-full border border-brand-bright bg-brand-strong px-5 text-sm font-semibold text-white shadow-overlay transition-colors hover:bg-brand">
        <MessageSquareText aria-hidden="true" className="size-4 text-brand-bright" />
        Roofing Advisor
      </AdvisorButton>
    </div>
  );
}
