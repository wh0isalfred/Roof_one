"use client";

import { RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { IssueType } from "@/lib/leads/options";
import { ISSUE_OPENERS } from "@/lib/roofing-advisor/opening";
import type { AdvisorIntent, RoofingAssessment } from "@/lib/roofing-advisor/types";
import { AdvisorComposer } from "./AdvisorComposer";
import { AdvisorEstimate } from "./AdvisorEstimate";
import { AdvisorHandoff } from "./AdvisorHandoff";
import { AdvisorMessage } from "./AdvisorMessage";
import { AdvisorPhotoUpload } from "./AdvisorPhotoUpload";
import { AdvisorSuggestions } from "./AdvisorSuggestions";
import { AdvisorTyping } from "./AdvisorTyping";
import { useAdvisorConversation } from "./useAdvisorConversation";
import { useKeyboardInset } from "./useKeyboardInset";

const INTENT_LABELS: Record<AdvisorIntent, string> = {
  leak: "Leak",
  storm_damage: "Storm damage",
  repair: "Repair",
  replacement: "Replacement",
  inspection: "Inspection",
  pricing: "Pricing",
  unknown: "Working it out",
  other: "Something else",
};

function summaryRows(a: RoofingAssessment): Array<[string, string | null]> {
  return [
    ["Issue", a.intent ? INTENT_LABELS[a.intent] : null],
    ["Where", a.leak_location],
    ["Started", a.issue_started ?? a.storm_date],
    ["Roof age", a.roof_age !== null ? `About ${a.roof_age} years` : null],
    ["Photos", a.photos_uploaded ? "Added" : null],
  ];
}

interface AdvisorChatProps {
  /** Set when the homeowner started from a shortcut like "Leaking". */
  initialIssue?: IssueType;
  onClose?: () => void;
  focusOnMount?: boolean;
}

/** The Roofing Advisor conversation. */
export function AdvisorChat({ initialIssue, onClose, focusOnMount = false }: AdvisorChatProps) {
  const { conversation, typing, pending, send, sendPhotos, retry, restart } = useAdvisorConversation({
    initialMessage: initialIssue ? ISSUE_OPENERS[initialIssue] : undefined,
  });
  const { messages, assessment, context, suggestions } = conversation;
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, [messages.length, typing, keyboardInset]);

  const last = messages.at(-1);
  const latestAdvisor = last?.role === "advisor" ? last : null;

  return (
    <div
      className="flex h-full flex-col bg-canvas text-ink"
      style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-canvas px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-brand-strong text-sm font-bold text-white"
          >
            R1
          </span>
          <div>
            <p className="text-xs font-bold tracking-eyebrow text-ink-muted uppercase">Roof One</p>
            <p className="text-sm font-semibold">
              Roofing Advisor <span className="font-normal text-success">• online</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={restart}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-subtle hover:text-ink disabled:opacity-50"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Start over</span>
            <span className="sr-only sm:hidden">Start over</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close Roofing Advisor</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-line bg-surface p-7 lg:block">
          <p className="text-[11px] font-bold tracking-eyebrow text-brand uppercase">Roofing Advisor</p>
          <h2 className="mt-4 font-headline text-3xl leading-[0.98]">Let’s figure out what your roof needs.</h2>
          <p className="mt-4 text-sm leading-6 text-ink-muted">
            Tell us what you’re seeing in your own words. We’ll ask only what matters, then get it to the team.
          </p>
          <div className="mt-10 border-t border-line pt-6">
            <p className="text-xs font-semibold tracking-eyebrow text-ink-muted uppercase">Your assessment</p>
            <dl className="mt-4 space-y-3 text-sm">
              {summaryRows(assessment).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="max-w-36 text-right font-medium">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-9">
            <div className="mx-auto max-w-2xl">
              <div className="mb-7 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-muted">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
                  Private assessment
                </span>
              </div>

              <div role="log" aria-label="Conversation with the Roofing Advisor" className="space-y-5">
                {messages.map((message) => {
                  const isLatest = message === latestAdvisor && !pending;
                  return (
                    <AdvisorMessage key={message.id} message={message} onRetry={() => retry(message.id)}>
                      {message.estimate && <AdvisorEstimate estimate={message.estimate} />}
                      {isLatest && message.requestPhoto && <AdvisorPhotoUpload variant="inline" onPhotos={sendPhotos} />}
                      {isLatest && message.handoff && <AdvisorHandoff onSend={send} />}
                    </AdvisorMessage>
                  );
                })}
                {typing && <AdvisorTyping />}
              </div>

              {context.closed && !pending && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
                    >
                      Close
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex h-11 items-center rounded-full border border-control px-5 text-sm font-semibold transition-colors hover:bg-subtle"
                  >
                    Start over
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-line bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-7 sm:pb-4">
            <div className="mx-auto max-w-2xl">
              {!typing && !context.closed && (
                <AdvisorSuggestions suggestions={suggestions} onSelect={send} disabled={pending} />
              )}
              <AdvisorComposer onSend={send} onPhotos={sendPhotos} busy={pending} autoFocus={focusOnMount} />
              <p className="mt-2 text-center text-[11px] text-ink-muted">
                You can type naturally or choose a suggested answer.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
