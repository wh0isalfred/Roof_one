"use client";

import { useEffect, useState } from "react";

/**
 * How much of the layout the on-screen keyboard covers, so the composer can
 * sit above it. Browsers that resize the page for the keyboard report 0.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !window.matchMedia("(pointer: coarse)").matches) return;
    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(covered > 60 ? Math.round(covered) : 0);
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
