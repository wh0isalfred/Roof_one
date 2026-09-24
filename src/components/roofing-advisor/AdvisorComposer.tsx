"use client";

import { Send } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { AdvisorPhotoUpload } from "./AdvisorPhotoUpload";

interface AdvisorComposerProps {
  onSend: (text: string) => void;
  onPhotos: (files: File[]) => void;
  /** While the advisor replies: typing is allowed, sending waits. */
  busy: boolean;
  autoFocus?: boolean;
}

const MAX_HEIGHT = 132;

/** Keyboards, not touchscreens: only then does the field take focus on its own. */
function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}

export function AdvisorComposer({ onSend, onPhotos, busy, autoFocus = false }: AdvisorComposerProps) {
  const [value, setValue] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  function resize() {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }

  // Back to the field after each reply, for keyboard users.
  useEffect(() => {
    if (!busy && autoFocus && hasFinePointer()) textarea.current?.focus({ preventScroll: true });
  }, [busy, autoFocus]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(resize);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter starts a new line.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-1.5 rounded-lg border border-control bg-surface p-1.5 focus-within:border-brand"
    >
      <AdvisorPhotoUpload variant="icon" onPhotos={onPhotos} disabled={busy} />
      <label htmlFor={id} className="sr-only">
        Your message
      </label>
      <textarea
        ref={textarea}
        id={id}
        rows={1}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          resize();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Tell us what's happening..."
        enterKeyHint="send"
        maxLength={2000}
        className="max-h-33 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-6 outline-none placeholder:text-ink-muted"
      />
      <button
        type="submit"
        disabled={!value.trim() || busy}
        aria-label="Send message"
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Send aria-hidden="true" className="size-4" />
      </button>
    </form>
  );
}
