"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { roofAfter, roofBefore } from "@/assets/photos";

/** Drag (or use arrow keys) to compare before and after. */
export function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const sizes = "(min-width: 1024px) 40rem, 100vw";

  return (
    <div className="relative isolate aspect-[16/9] overflow-hidden lg:aspect-auto lg:min-h-[22rem]">
      <Image src={roofAfter} alt="" fill sizes={sizes} placeholder="blur" className="object-cover" />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image src={roofBefore} alt="" fill sizes={sizes} placeholder="blur" className="object-cover" />
      </div>

      <span className="absolute bottom-4 left-4 rounded-md bg-ink/80 px-3 py-1.5 text-xs font-semibold text-white">
        Before
      </span>
      <span className="absolute right-4 bottom-4 rounded-md bg-ink/80 px-3 py-1.5 text-xs font-semibold text-white">
        After
      </span>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full bg-white text-brand-strong shadow-overlay">
          <ChevronLeft className="size-4" />
          <ChevronRight className="-ml-1 size-4" />
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Compare the roof before and after replacement"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
