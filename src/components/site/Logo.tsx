import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/** Text wordmark until a real logo is supplied. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-xl font-extrabold tracking-wide uppercase",
        className,
      )}
    >
      {siteConfig.name}
    </Link>
  );
}
