import Link from "next/link";
import { cn } from "@/lib/cn";

/** Roof mark plus wordmark. "ONE" takes the bright accent, so use it on dark surfaces. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-headline inline-flex items-center gap-2.5 text-xl uppercase",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 40 24"
        className="h-6 w-10 shrink-0"
      >
        <path d="M0 22 16 4l8 9-6 9Z" fill="var(--color-brand)" />
        <path d="M16 4 22 0l18 22H22Z" fill="var(--color-brand-bright)" />
      </svg>
      <span>
        Roof <span className="text-brand-bright">One</span>
      </span>
    </Link>
  );
}
