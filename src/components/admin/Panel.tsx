import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PanelProps {
  /** Used to build the heading id for aria-labelledby. */
  id: string;
  title: string;
  /** Extra content on the right of the heading, e.g. a count or action. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A titled block of content in the admin. */
export function Panel({ id, title, aside, children, className }: PanelProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("border border-line bg-surface", className)}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <h2 id={headingId} className="text-sm font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export interface DetailItem {
  label: string;
  value: ReactNode;
}

/** Label/value rows. Empty values show a dash. */
export function DetailList({ items }: { items: readonly DetailItem[] }) {
  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-0.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="text-sm text-ink-muted">{item.label}</dt>
          <dd className="text-sm font-medium break-words">
            {item.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
