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
  className?: string;
}

/** Section headline and optional lead. Wrap words in <Accent> to color them. */
export function SectionHeading({
  id,
  title,
  description,
  tone = "default",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h2
        id={id}
        className={cn(
          "font-headline text-[2rem] leading-[1.06] sm:text-[2.5rem] lg:text-[2.75rem]",
          tone === "inverse" ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 max-w-lg text-[1.0625rem] leading-relaxed",
            tone === "inverse" ? "text-white/75" : "text-ink-muted",
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
    "group mt-7 inline-flex items-center gap-2 font-semibold",
    tone === "inverse" ? "text-brand-bright" : "text-brand",
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
