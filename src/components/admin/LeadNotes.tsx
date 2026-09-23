import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";
import type { LeadEvent } from "@/lib/leads/types";

/** Internal notes are stored as `note_added` lead events. */
export function LeadNotes({
  leadId,
  events,
}: {
  leadId: string;
  events: readonly LeadEvent[];
}) {
  const notes = events.flatMap((event) =>
    event.event_type === "note_added" && typeof event.metadata.note === "string"
      ? [{ id: event.id, text: event.metadata.note, createdAt: event.created_at }]
      : [],
  );
  const fieldId = `note-${leadId}`;

  return (
    <div className="grid gap-5">
      {notes.length > 0 ? (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li key={note.id} className="bg-canvas px-4 py-3 text-sm">
              <p>{note.text}</p>
              <time
                dateTime={note.createdAt}
                className="mt-1 block text-xs text-ink-muted"
              >
                {formatDateTime(note.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No notes yet.</p>
      )}

      {/* Saving notes is connected with Supabase in the next stage. */}
      <form className="grid gap-2">
        <label htmlFor={fieldId} className="text-sm font-semibold">
          Add a note
        </label>
        <textarea
          id={fieldId}
          rows={3}
          disabled
          className="rounded-md border border-control bg-surface px-3 py-2 text-base disabled:bg-canvas sm:text-sm"
        />
        <Button type="submit" variant="outline" disabled className="justify-self-start">
          Save note
        </Button>
      </form>
    </div>
  );
}
