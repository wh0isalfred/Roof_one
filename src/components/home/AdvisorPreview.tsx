"use client";

import { ArrowRight, Clock, MessageSquareText, X } from "lucide-react";
import { useState } from "react";
import { ISSUE_ICONS } from "@/components/issue-icons";
import { useOpenAdvisor } from "@/components/roofing-advisor/AdvisorDialog";
import type { IssueType } from "@/lib/leads/options";
import { cn } from "@/lib/cn";

const QUICK_ISSUES: readonly { value: IssueType; label: string }[] = [
  { value: "leak", label: "Leaking" },
  { value: "storm_damage", label: "Storm damage" },
  { value: "replacement", label: "Need a new roof" },
  { value: "not_sure", label: "Not sure" },
];

function AdvisorMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-brand text-white", className)}
    >
      <svg viewBox="0 0 40 24" className="w-1/2">
        <path d="M0 22 16 4l8 9-6 9Z" fill="currentColor" opacity="0.7" />
        <path d="M16 4 22 0l18 22H22Z" fill="currentColor" />
      </svg>
    </span>
  );
}

/** A preview of the advisor's first question. Starting it opens the full Roofing Advisor. */
export function AdvisorPreview() {
  const openAdvisor = useOpenAdvisor();
  const [issue, setIssue] = useState<IssueType | undefined>();
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="flex w-full items-center gap-3 rounded-lg border border-line bg-canvas p-4 text-left shadow-overlay transition-colors hover:border-brand"
      >
        <AdvisorMark className="size-10" />
        <span className="flex-1 font-semibold">Roofing Advisor</span>
        <MessageSquareText aria-hidden="true" className="size-5 text-brand" />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-canvas p-5 shadow-overlay sm:p-6">
      <div className="flex items-center gap-3">
        <AdvisorMark className="size-9" />
        <p className="flex-1 font-semibold">
          Roofing Advisor
          <span aria-hidden="true" className="ml-1.5 inline-block size-2 rounded-full bg-success align-middle" />
        </p>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="flex size-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Minimize</span>
        </button>
      </div>

      <div className="mt-5 flex gap-3">
        <AdvisorMark className="mt-1 size-8" />
        <div className="grid gap-2 text-sm">
          <p className="rounded-lg rounded-tl-sm bg-brand-soft px-4 py-3">
            Hi! Let’s figure out what’s happening with your roof.
          </p>
          <p className="w-fit rounded-lg bg-brand-soft px-4 py-3">
            What’s the main issue you’re seeing?
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3">
        {QUICK_ISSUES.map(({ value, label }) => {
          const Icon = ISSUE_ICONS[value];
          return (
            <li key={value}>
              <button
                type="button"
                aria-pressed={issue === value}
                onClick={() => setIssue(value)}
                className="flex h-14 w-full items-center gap-3 rounded-md border border-line bg-canvas px-3 text-left text-sm font-medium transition-colors hover:border-control aria-pressed:border-brand aria-pressed:bg-brand-soft sm:px-4"
              >
                <Icon aria-hidden="true" className="size-5 shrink-0 text-brand" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => openAdvisor(issue)}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand font-semibold text-white transition-colors hover:bg-brand-strong"
      >
        Start assessment
        <ArrowRight aria-hidden="true" className="size-4" />
      </button>
      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-muted">
        <Clock aria-hidden="true" className="size-3.5" />
        Takes about 2 minutes
      </p>
    </div>
  );
}
