"use client";

import { X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LogoMark } from "@/components/site/Logo";
import type { IssueType } from "@/lib/leads/options";
import { RoofingAdvisor } from "./RoofingAdvisor";

type OpenAdvisor = (issue?: IssueType) => void;

const AdvisorContext = createContext<OpenAdvisor | null>(null);

export function useOpenAdvisor(): OpenAdvisor {
  const open = useContext(AdvisorContext);
  if (!open) throw new Error("useOpenAdvisor must be used inside AdvisorProvider");
  return open;
}

interface Session {
  key: number;
  issue?: IssueType;
}

/**
 * Hosts the one Roofing Advisor dialog for the public site. Any CTA opens it
 * through `useOpenAdvisor` or `AdvisorButton`. It takes over the whole screen
 * so the assessment reads as its own guided tool, not a form on the page.
 * Closing keeps answers in place, so reopening continues where the visitor
 * left off; opening with a different issue starts a fresh assessment.
 */
export function AdvisorProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [openRequest, setOpenRequest] = useState(0);

  const open = useCallback<OpenAdvisor>((issue) => {
    setSession((current) => {
      if (current && (issue === undefined || issue === current.issue)) {
        return current;
      }
      return { key: (current?.key ?? 0) + 1, issue };
    });
    setOpenRequest((count) => count + 1);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (openRequest === 0 || !dialog || dialog.open) return;
    dialog.showModal();
    // showModal focuses the close button; land on the current question instead.
    dialog.querySelector<HTMLElement>("h3[tabindex='-1']")?.focus();
  }, [openRequest]);

  const close = () => dialogRef.current?.close();

  return (
    <AdvisorContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="advisor-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="dialog-panel on-light m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-canvas text-ink"
      >
        <div className="flex h-full flex-col">
          <div className="on-dark shrink-0 bg-brand-strong text-white">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <LogoMark />
                <h2 id="advisor-dialog-title" className="font-headline text-lg">
                  Roofing Advisor
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="-mr-2 flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
              >
                <X aria-hidden="true" className="size-5" />
                <span className="sr-only">Close Roofing Advisor</span>
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            {session && (
              <RoofingAdvisor
                key={session.key}
                initialAnswers={session.issue ? { issue_type: session.issue } : {}}
                focusOnMount
              />
            )}
          </div>
        </div>
      </dialog>
    </AdvisorContext.Provider>
  );
}

interface AdvisorButtonProps {
  issue?: IssueType;
  className?: string;
  onOpen?: () => void;
  children: ReactNode;
}

/** A button that opens the Roofing Advisor. Lets server components place advisor CTAs. */
export function AdvisorButton({
  issue,
  className,
  onOpen,
  children,
}: AdvisorButtonProps) {
  const open = useOpenAdvisor();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => {
        onOpen?.();
        open(issue);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
