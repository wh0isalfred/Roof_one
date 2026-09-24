import { MessageSquareText, Phone, PhoneIncoming } from "lucide-react";
import { advisorConfig } from "@/config/advisor";

interface AdvisorHandoffProps {
  /** Sends the choice as the homeowner's own message. */
  onSend: (text: string) => void;
  disabled?: boolean;
}

const optionClasses =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Ways to reach a person: call now, ask for a callback, or keep chatting. */
export function AdvisorHandoff({ onSend, disabled = false }: AdvisorHandoffProps) {
  return (
    <div role="group" aria-label="Talk to the team" className="flex flex-wrap gap-2">
      <a href={advisorConfig.phoneHref} className={`${optionClasses} border-accent bg-accent text-white hover:bg-accent-strong`}>
        <Phone aria-hidden="true" className="size-4" />
        Call {advisorConfig.phoneDisplay}
      </a>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSend("Can someone call me back?")}
        className={`${optionClasses} border-control bg-canvas hover:bg-subtle`}
      >
        <PhoneIncoming aria-hidden="true" className="size-4" />
        Request a callback
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSend("Let's keep chatting here.")}
        className={`${optionClasses} border-control bg-canvas hover:bg-subtle`}
      >
        <MessageSquareText aria-hidden="true" className="size-4" />
        Keep chatting
      </button>
    </div>
  );
}
