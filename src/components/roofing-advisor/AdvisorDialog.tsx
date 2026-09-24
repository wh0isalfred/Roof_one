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
 * through `useOpenAdvisor` or `AdvisorButton`. Closing keeps answers in place,
 * so reopening continues where the visitor left off; opening with a different
 * issue starts a fresh assessment.
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
        className="dialog-panel on-light m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-canvas text-ink sm:m-auto sm:h-auto sm:max-h-[min(88dvh,56rem)] sm:w-[calc(100%-3rem)] sm:max-w-4xl sm:rounded-lg sm:shadow-overlay"
      >
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex items-center justify-between gap-4 bg-brand-strong px-5 py-4 text-white sm:px-8">
            <h2 id="advisor-dialog-title" className="font-headline text-xl">
              Roofing Advisor
            </h2>
            <button
              type="button"
              onClick={close}
              className="on-dark flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close Roofing Advisor</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
