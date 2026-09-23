"use client";

import {
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  Workflow,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS: readonly { label: string; href: Route; icon: LucideIcon }[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Automation", href: "/admin/automation", icon: Workflow },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {ITEMS.map(({ label, href, icon: Icon }) => {
          const isPage = pathname === href;
          const isSection = href !== "/admin" && pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isPage ? "page" : isSection ? "true" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-3",
                  isPage || isSection
                    ? "bg-subtle text-ink"
                    : "text-ink-muted hover:bg-subtle hover:text-ink",
                )}
              >
                <Icon aria-hidden="true" className="hidden size-4 sm:block" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
