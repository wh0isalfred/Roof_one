import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { MESSAGE_CHANNEL_OPTIONS } from "@/lib/leads/options";
import type { LeadMessage } from "@/lib/leads/types";
import { getOptionLabel } from "@/lib/options";

/** Every message with the homeowner, oldest first, across all channels. */
export function LeadConversation({
  messages,
}: {
  messages: readonly LeadMessage[];
}) {
  if (messages.length === 0) {
    return <p className="text-sm text-ink-muted">No messages yet.</p>;
  }

  return (
    <ol className="grid gap-4">
      {messages.map((message) => (
        <li
          key={message.id}
          className={cn(
            "border-l-2 pl-4",
            message.direction === "inbound" ? "border-control" : "border-accent",
          )}
        >
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-ink">
              {message.direction === "inbound" ? "From homeowner" : "To homeowner"}
            </span>{" "}
            · {getOptionLabel(MESSAGE_CHANNEL_OPTIONS, message.channel)} ·{" "}
            <time dateTime={message.created_at}>
              {formatDateTime(message.created_at)}
            </time>
          </p>
          <p className="mt-1 text-sm">{message.message}</p>
        </li>
      ))}
    </ol>
  );
}
