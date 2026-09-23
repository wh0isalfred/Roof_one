"use client";

import { House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/config/site";
import { cn } from "@/lib/cn";

/** Desktop navigation: a compact floating bar of links. */
export function PrimaryNav({
  links,
  className,
}: {
  links: readonly NavLink[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={className}>
      <ul className="on-light flex items-center gap-1 rounded-full bg-surface p-1.5">
        {links.map((link) => {
          const isCurrent = link.href === pathname;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                  isCurrent
                    ? "bg-accent text-white"
                    : "text-ink hover:bg-subtle",
                )}
              >
                {link.href === "/" && (
                  <House aria-hidden="true" className="size-4" />
                )}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
