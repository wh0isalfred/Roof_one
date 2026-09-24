import type { NewLead } from "@/lib/leads/types";
import { type AdvisorEvent, createAdvisorEvent } from "../events";
import type { AdvisorAttachment, AdvisorMessage } from "../types";
import {
  type AdvisorStore,
  type AdvisorTurnRecord,
  conversationStatus,
  type PhotoUpload,
  type SavedTurn,
} from "./types";

interface StoredConversation {
  id: string;
  created_at: string;
  updated_at: string;
  status: ReturnType<typeof conversationStatus>;
  stage: string;
  lead_id: string | null;
}

export interface StoredLead extends NewLead {
  id: string;
  created_at: string;
  conversation_id: string;
}

/**
 * Keeps advisor data in memory. For local development and tests: nothing
 * survives a restart, and each server instance has its own copy.
 */
export class MemoryAdvisorStore implements AdvisorStore {
  readonly name = "memory";
  readonly durable = false;

  private readonly conversations = new Map<string, StoredConversation>();
  private readonly messages = new Map<string, AdvisorMessage[]>();
  private readonly assessments = new Map<string, Omit<AdvisorTurnRecord, "messages" | "events" | "lead">>();
  private readonly events: AdvisorEvent[] = [];
  private readonly leads = new Map<string, StoredLead>();
  private readonly photos = new Map<string, AdvisorAttachment[]>();

  async saveTurn(record: AdvisorTurnRecord): Promise<SavedTurn> {
    const now = new Date().toISOString();
    const conversation = this.conversations.get(record.conversationId) ?? {
      id: record.conversationId,
      created_at: now,
      updated_at: now,
      status: "active" as const,
      stage: "greeting",
      lead_id: null,
    };
    conversation.status = conversationStatus(record.stage);
    conversation.stage = record.stage;
    conversation.updated_at = now;
    this.conversations.set(conversation.id, conversation);

    const stored = this.messages.get(conversation.id) ?? [];
    for (const message of record.messages) {
      if (!stored.some((existing) => existing.id === message.id)) stored.push(message);
    }
    this.messages.set(conversation.id, stored);

    const { conversationId, stage, assessment, confidence, estimate, completeness } = record;
    this.assessments.set(conversationId, { conversationId, stage, assessment, confidence, estimate, completeness });

    // One lead per conversation: created on the first turn with contact details, updated after.
    let leadCreated = false;
    if (record.lead) {
      if (conversation.lead_id === null) {
        const id = crypto.randomUUID();
        this.leads.set(id, { ...record.lead, id, created_at: now, conversation_id: conversation.id });
        conversation.lead_id = id;
        leadCreated = true;
      } else {
        const existing = this.leads.get(conversation.lead_id);
        if (existing) this.leads.set(existing.id, { ...existing, ...withoutNulls(record.lead) });
      }
    }

    const leadId = conversation.lead_id;
    const events = [
      ...record.events,
      ...(leadCreated ? [createAdvisorEvent("LEAD_CREATED", conversation.id, { source: "roofing_advisor" })] : []),
    ].map((event) => ({ ...event, lead_id: leadId }));
    this.events.push(...events);
    return { leadId, leadCreated, events };
  }

  async savePhoto(conversationId: string, photo: PhotoUpload): Promise<AdvisorAttachment> {
    const attachment: AdvisorAttachment = {
      id: photo.id,
      kind: "photo",
      name: photo.name,
      content_type: photo.contentType,
      size: photo.data.byteLength,
      // The bytes aren't kept in memory; only Supabase Storage keeps files.
      storage_path: null,
    };
    this.photos.set(conversationId, [...(this.photos.get(conversationId) ?? []), attachment]);
    return attachment;
  }

  // Read helpers for tests and local debugging.
  leadFor(conversationId: string): StoredLead | null {
    const id = this.conversations.get(conversationId)?.lead_id;
    return id ? (this.leads.get(id) ?? null) : null;
  }

  leadCount(): number {
    return this.leads.size;
  }

  messagesFor(conversationId: string): AdvisorMessage[] {
    return [...(this.messages.get(conversationId) ?? [])];
  }

  eventsFor(conversationId: string): AdvisorEvent[] {
    return this.events.filter((event) => event.conversation_id === conversationId);
  }

  conversation(conversationId: string): StoredConversation | null {
    return this.conversations.get(conversationId) ?? null;
  }
}

function withoutNulls<T extends object>(record: T): Partial<T> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null)) as Partial<T>;
}
