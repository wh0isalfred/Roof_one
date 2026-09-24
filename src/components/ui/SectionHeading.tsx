import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "inverse";

export function Eyebrow({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-semibold tracking-eyebrow uppercase",
        tone === "inverse" ? "text-brand-bright" : "text-brand",
        className,
      )}
    >
      <span aria-hidden="true" className="h-0.5 w-7 bg-current" />
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  /** Referenced by the section's aria-labelledby. */
  id: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  className?: string;
}

/** Eyebrow, headline and optional lead. Wrap words in <Accent> to color them. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  tone = "default",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn(
          "mt-4 font-display text-3xl leading-[1.12] font-semibold tracking-tight sm:text-4xl lg:text-[2.6rem]",
          tone === "inverse" ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 max-w-lg text-base leading-relaxed text-pretty sm:text-lg",
            tone === "inverse" ? "text-on-brand-muted" : "text-ink-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function Accent({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={tone === "inverse" ? "text-brand-bright" : "text-brand"}>
      {children}
    </span>
  );
}

/** "View all →" style link under a section intro. */
export function MoreLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand"
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
      />
    </Link>
  );
}
