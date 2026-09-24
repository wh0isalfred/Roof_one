import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type AdvisorEvent, createAdvisorEvent } from "../events";
import type { AdvisorAttachment } from "../types";
import {
  type AdvisorStore,
  type AdvisorTurnRecord,
  conversationStatus,
  type PhotoUpload,
  type SavedTurn,
} from "./types";

export const ADVISOR_PHOTO_BUCKET = "advisor-photos";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

interface LeadUpsertResult {
  lead_id: string;
  created: boolean;
}

function check(error: { message: string } | null, action: string): void {
  if (error) throw new Error(`Supabase ${action} failed: ${error.message}`);
}

/**
 * Advisor data in Supabase: conversations, messages, assessment snapshots,
 * events, photos in Storage, and the lead (created once per conversation by
 * the upsert_advisor_lead database function). Uses the service role, so it
 * must only ever run on the server.
 */
export class SupabaseAdvisorStore implements AdvisorStore {
  readonly name = "supabase";
  readonly durable = true;

  constructor(private readonly client: SupabaseClient) {}

  async saveTurn(record: AdvisorTurnRecord): Promise<SavedTurn> {
    const id = record.conversationId;
    const now = new Date().toISOString();

    const conversation = await this.client
      .from("advisor_conversations")
      .upsert({ id, stage: record.stage, status: conversationStatus(record.stage), updated_at: now }, { onConflict: "id" });
    check(conversation.error, "conversation upsert");

    if (record.messages.length > 0) {
      const messages = await this.client.from("advisor_messages").upsert(
        record.messages.map((message) => ({
          id: message.id,
          conversation_id: id,
          role: message.role,
          content: message.content,
          metadata: { goal: message.goal ?? null, attachments: message.attachments ?? [] },
          created_at: message.created_at,
        })),
        { onConflict: "id", ignoreDuplicates: true },
      );
      check(messages.error, "message insert");
    }

    const snapshot = await this.client.from("advisor_assessments").upsert(
      {
        conversation_id: id,
        assessment_json: record.assessment,
        confidence_json: record.confidence,
        estimate_json: record.estimate,
        completeness_json: record.completeness,
        updated_at: now,
      },
      { onConflict: "conversation_id" },
    );
    check(snapshot.error, "assessment upsert");

    let leadId: string | null = null;
    let leadCreated = false;
    if (record.lead) {
      const { data, error } = await this.client.rpc("upsert_advisor_lead", {
        p_conversation_id: id,
        p_lead: record.lead,
      });
      check(error, "lead upsert");
      const result = data as LeadUpsertResult | null;
      leadId = result?.lead_id ?? null;
      leadCreated = result?.created ?? false;
    }

    const events: AdvisorEvent[] = [
      ...record.events,
      ...(leadCreated ? [createAdvisorEvent("LEAD_CREATED", id, { source: "roofing_advisor" })] : []),
    ].map((event) => ({ ...event, lead_id: leadId }));
    if (events.length > 0) {
      const inserted = await this.client.from("advisor_events").insert(
        events.map((event) => ({
          conversation_id: id,
          lead_id: event.lead_id,
          event_type: event.type,
          payload: event.payload,
          created_at: event.occurred_at,
        })),
      );
      check(inserted.error, "event insert");
    }

    return { leadId, leadCreated, events };
  }

  async savePhoto(conversationId: string, photo: PhotoUpload): Promise<AdvisorAttachment> {
    // Photos can arrive before the first message is saved.
    const conversation = await this.client
      .from("advisor_conversations")
      .upsert({ id: conversationId }, { onConflict: "id", ignoreDuplicates: true });
    check(conversation.error, "conversation upsert");

    const path = `${conversationId}/${photo.id}.${EXTENSIONS[photo.contentType] ?? "jpg"}`;
    const upload = await this.client.storage
      .from(ADVISOR_PHOTO_BUCKET)
      .upload(path, photo.data, { contentType: photo.contentType, upsert: false });
    check(upload.error, "photo upload");

    return {
      id: photo.id,
      kind: "photo",
      name: photo.name,
      content_type: photo.contentType,
      size: photo.data.byteLength,
      storage_path: path,
    };
  }
}
