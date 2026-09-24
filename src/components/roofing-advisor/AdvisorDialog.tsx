"use client";

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

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [openRequest, setOpenRequest] = useState(0);

  const open = useCallback<OpenAdvisor>((issue) => {
    setSession((current) => {
      if (current && (issue === undefined || issue === current.issue)) return current;
      return { key: (current?.key ?? 0) + 1, issue };
    });
    setOpenRequest((count) => count + 1);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (openRequest === 0 || !dialog || dialog.open) return;
    dialog.showModal();
  }, [openRequest]);

  const close = () => dialogRef.current?.close();

  return (
    <AdvisorContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        aria-label="Roof One Roofing Advisor"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="dialog-panel on-light m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-canvas text-ink sm:m-auto sm:h-[min(92dvh,56rem)] sm:w-[calc(100%-3rem)] sm:max-w-6xl sm:rounded-lg sm:shadow-overlay"
      >
        <div className="h-full max-h-[inherit]">
          {session && (
            <RoofingAdvisor
              key={session.key}
              initialAnswers={session.issue ? { issue_type: session.issue } : {}}
              onClose={close}
              focusOnMount
            />
          )}
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
