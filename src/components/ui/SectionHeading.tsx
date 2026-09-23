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
        "text-xs font-semibold tracking-eyebrow uppercase",
        tone === "inverse" ? "text-on-brand-muted" : "text-accent",
        className,
      )}
    >
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

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  tone = "default",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn(
          "mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl",
          tone === "inverse" ? "text-canvas" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base text-pretty sm:text-lg",
            tone === "inverse" ? "text-on-brand-muted" : "text-ink-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
