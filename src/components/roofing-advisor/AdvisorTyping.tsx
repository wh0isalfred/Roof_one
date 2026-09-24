import { AdvisorAvatar } from "./AdvisorMessage";

/** The advisor's three-dot typing indicator. */
export function AdvisorTyping() {
  return (
    <div role="status" className="flex items-center gap-3">
      <AdvisorAvatar />
      <div className="flex h-11 items-center gap-1.5 rounded-lg rounded-tl-sm border border-line bg-canvas px-4">
        <span className="sr-only">Roofing Advisor is typing</span>
        <span aria-hidden="true" className="size-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.3s] motion-reduce:animate-none" />
        <span aria-hidden="true" className="size-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.15s] motion-reduce:animate-none" />
        <span aria-hidden="true" className="size-1.5 animate-bounce rounded-full bg-ink-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
