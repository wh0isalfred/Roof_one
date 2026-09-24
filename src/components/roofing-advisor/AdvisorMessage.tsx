import { RotateCcw } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "./useAdvisorConversation";

export function AdvisorAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-strong text-[10px] font-bold text-white",
        className,
      )}
    >
      R1
    </span>
  );
}

interface AdvisorMessageProps {
  message: ChatMessage;
  onRetry: () => void;
  /** Shown under an advisor message: the estimate, photo request or handoff options. */
  children?: ReactNode;
}

/** One message in the conversation. The advisor on the left, the homeowner on the right. */
export function AdvisorMessage({ message, onRetry, children }: AdvisorMessageProps) {
  if (message.role === "advisor") {
    return (
      <div className="flex items-start gap-3">
        <AdvisorAvatar className="mt-1" />
        <div className="min-w-0 max-w-[85%] space-y-3">
          <p className="sr-only">Roofing Advisor:</p>
          <p className="w-fit rounded-lg rounded-tl-sm border border-line bg-canvas px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap">
            {message.content}
          </p>
          {children}
        </div>
      </div>
    );
  }

  const photos = message.previews ?? [];
  const uploading = message.status === "sending" && photos.length > 0 && (message.attachments?.length ?? 0) === 0;
  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="sr-only">You:</p>
      {photos.length > 0 && (
        <ul aria-label="Photos you shared" className="flex max-w-[82%] flex-wrap justify-end gap-2">
          {photos.map((src, index) => (
            <li key={src} className="relative size-24 overflow-hidden rounded-md border border-line bg-subtle sm:size-28">
              <Image
                src={src}
                alt={`Photo ${index + 1}`}
                fill
                unoptimized
                sizes="112px"
                className={cn("object-cover", uploading && "opacity-60")}
              />
            </li>
          ))}
        </ul>
      )}
      {message.content && (
        <p className="max-w-[82%] rounded-lg rounded-tr-sm bg-brand px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap text-white">
          {message.content}
        </p>
      )}
      {uploading && <p className="text-xs text-ink-muted">Uploading…</p>}
      {message.status === "failed" && (
        <p className="flex items-center gap-2 text-xs text-danger">
          {message.error ?? "Didn't send."}
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-sm font-semibold text-ink underline underline-offset-2"
          >
            <RotateCcw aria-hidden="true" className="size-3" />
            Try again
          </button>
        </p>
      )}
    </div>
  );
}
