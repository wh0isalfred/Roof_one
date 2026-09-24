import type { NextRequest } from "next/server";
import { cleanFileName, PHOTO_LIMITS, sniffImageType } from "@/lib/roofing-advisor/photos";
import { clientKey, rateLimit } from "@/lib/roofing-advisor/rate-limit";
import { getAdvisorStore } from "@/lib/roofing-advisor/store";
import type { AdvisorPhotoUploadResponse } from "@/lib/roofing-advisor/types";
import { isUuid } from "@/lib/roofing-advisor/validation";

function error(status: number, message: string, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** POST /api/roofing-advisor/photos: multipart form with conversationId and photos. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`photos:${clientKey(request.headers)}`, 12, 60_000);
  if (!limit.ok) return error(429, "Too many photos at once. Try again in a minute.", { "Retry-After": String(limit.retryAfter) });
  if (Number(request.headers.get("content-length") ?? 0) > PHOTO_LIMITS.maxBytes * PHOTO_LIMITS.filesPerRequest) {
    return error(413, "Those photos are too large.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "Send the photos as multipart form data.");
  }
  const conversationId = form.get("conversationId");
  if (!isUuid(conversationId)) return error(400, "conversationId must be a UUID.");
  const files = form.getAll("photos").filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) return error(400, "No photos were attached.");
  if (files.length > PHOTO_LIMITS.filesPerRequest) return error(400, `Send at most ${PHOTO_LIMITS.filesPerRequest} photos at a time.`);

  const uploads = [];
  for (const file of files) {
    if (file.size === 0 || file.size > PHOTO_LIMITS.maxBytes) return error(413, "Each photo must be under 5 MB.");
    const data = await file.arrayBuffer();
    const contentType = sniffImageType(new Uint8Array(data, 0, Math.min(16, data.byteLength)));
    if (!contentType) return error(415, "Only JPEG, PNG, WebP and HEIC photos can be uploaded.");
    uploads.push({ id: crypto.randomUUID(), name: cleanFileName(file.name), contentType, data });
  }

  try {
    const store = getAdvisorStore();
    const photos = await Promise.all(uploads.map((upload) => store.savePhoto(conversationId, upload)));
    const body: AdvisorPhotoUploadResponse = { photos };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error(`Roofing Advisor: photo upload failed (${cause instanceof Error ? cause.message : "unknown error"}).`);
    return error(500, "The photo couldn't be saved.");
  }
}
