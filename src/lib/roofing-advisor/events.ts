/*
 * Advisor events.
 *
 * The advisor announces what happened; it doesn't know who's listening.
 * Automation (confirmation texts, follow-ups, alerts) subscribes here later,
 * behind its own provider adapters.
 *
 * Values mirror the advisor_event_type enum in supabase/migrations.
 */

export const ADVISOR_EVENT_TYPES = [
  "LEAD_CREATED",
  "ASSESSMENT_COMPLETED",
  "ESTIMATE_GENERATED",
  "PHOTO_UPLOADED",
  "HUMAN_REQUESTED",
  "CONTACT_SUBMITTED",
] as const;

export type AdvisorEventType = (typeof ADVISOR_EVENT_TYPES)[number];

type EventValue = string | number | boolean | null | EventValue[] | { [key: string]: EventValue };

export interface AdvisorEvent {
  type: AdvisorEventType;
  conversation_id: string;
  lead_id: string | null;
  occurred_at: string;
  payload: Record<string, EventValue>;
}

export function createAdvisorEvent(
  type: AdvisorEventType,
  conversationId: string,
  payload: Record<string, EventValue> = {},
  occurredAt: Date = new Date(),
): AdvisorEvent {
  return {
    type,
    conversation_id: conversationId,
    lead_id: null,
    occurred_at: occurredAt.toISOString(),
    payload,
  };
}

export type AdvisorEventListener = (event: AdvisorEvent) => void | Promise<void>;

const listeners = new Set<AdvisorEventListener>();

/** Subscribes to advisor events. Returns an unsubscribe function. */
export function onAdvisorEvent(listener: AdvisorEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Delivers events to every listener. One failing listener never blocks the others. */
export async function emitAdvisorEvents(events: readonly AdvisorEvent[]): Promise<void> {
  for (const event of events) {
    await Promise.allSettled([...listeners].map(async (listener) => listener(event)));
  }
}
