import { PHOTO_LIMITS } from "./photos";
import type {
  AdvisorAttachment,
  AdvisorMessageRequest,
  AdvisorMessageResponse,
  AdvisorPhotoUploadResponse,
} from "./types";

/*
 * Browser-side calls to the advisor API. The chat UI talks to the advisor
 * only through these; it never sees provider keys or SDKs.
 */

export class AdvisorRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdvisorRequestError";
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Not JSON; fall through.
  }
  return "Something went wrong.";
}

export async function sendAdvisorMessage(
  request: AdvisorMessageRequest,
  signal?: AbortSignal,
): Promise<AdvisorMessageResponse> {
  const response = await fetch("/api/roofing-advisor/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) throw new AdvisorRequestError(await readError(response), response.status);
  return (await response.json()) as AdvisorMessageResponse;
}

export async function uploadAdvisorPhoto(
  conversationId: string,
  photo: Blob,
  name: string,
): Promise<AdvisorAttachment> {
  const form = new FormData();
  form.set("conversationId", conversationId);
  form.append("photos", photo, name);
  const response = await fetch("/api/roofing-advisor/photos", { method: "POST", body: form });
  if (!response.ok) throw new AdvisorRequestError(await readError(response), response.status);
  const body = (await response.json()) as AdvisorPhotoUploadResponse;
  const [attachment] = body.photos;
  if (!attachment) throw new AdvisorRequestError("The photo wasn't saved.", 500);
  return attachment;
}

/** Shrinks a photo before upload, so it's quick on mobile data. Falls back to the original. */
export async function preparePhoto(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_LIMITS.maxDimension / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.type === "image/jpeg" && file.size <= 1_500_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    // e.g. HEIC in a browser that can't decode it: the server accepts it as-is.
    return file;
  }
}

/**
 * How long the advisor "types" before a reply appears: a beat longer for
 * longer replies, never exactly the same, always 500–1400ms.
 */
export function replyDelay(reply: string, random: () => number = Math.random): number {
  const base = 480 + reply.length * 9;
  const jitter = (random() - 0.5) * 240;
  return Math.round(Math.min(1400, Math.max(500, base + jitter)));
}
