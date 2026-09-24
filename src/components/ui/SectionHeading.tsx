import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "inverse";

interface SectionHeadingProps {
  /** Referenced by the section's aria-labelledby. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  /** `large` is for the closing call to action only. */
  size?: "default" | "large";
  className?: string;
}

/**
 * Section title and optional lead. The heading carries the section on its
 * own: no label above it, one colour, and a lead that stays quieter.
 */
export function SectionHeading({
  id,
  title,
  description,
  tone = "default",
  size = "default",
  className,
}: SectionHeadingProps) {
  return (
    <div className={className}>
      <h2
        id={id}
        className={cn(
          // An em-based measure keeps every title to one or two balanced lines.
          "font-headline max-w-[17em]",
          size === "large" ? "text-heading-lg" : "text-heading",
          tone === "inverse" ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-6 max-w-xl text-lg leading-relaxed",
            tone === "inverse" ? "text-white/85" : "text-ink-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/** "Something →" link under a section intro. */
export function MoreLink({
  href,
  children,
  tone = "default",
}: {
  href: Route | `tel:${string}`;
  children: ReactNode;
  tone?: Tone;
}) {
  const className = cn(
    "group mt-7 inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline",
    tone === "inverse" ? "text-white" : "text-brand",
  );
  const content = (
    <>
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
      />
    </>
  );
  return href.startsWith("tel:") ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href as Route} className={className}>
      {content}
    </Link>
  );
}
