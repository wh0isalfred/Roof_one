import { after, type NextRequest } from "next/server";
import { getAdvisorProvider } from "@/lib/roofing-advisor/providers";
import { clientKey, rateLimit } from "@/lib/roofing-advisor/rate-limit";
import { processAdvisorMessage } from "@/lib/roofing-advisor/service";
import { getAdvisorStore } from "@/lib/roofing-advisor/store";
import { parseMessageRequest } from "@/lib/roofing-advisor/validation";

// Leaves room for a slow AI turn plus saving the turn afterwards.
export const maxDuration = 30;

const MAX_BODY_BYTES = 256 * 1024;

function error(status: number, message: string, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** POST /api/roofing-advisor/message: one homeowner message in, the advisor's reply out. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`message:${clientKey(request.headers)}`, 30, 60_000);
  if (!limit.ok) {
    return error(429, "Too many messages at once. Try again in a minute.", { "Retry-After": String(limit.retryAfter) });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return error(413, "That conversation is too long to send.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "The request body must be JSON.");
  }
  const parsed = parseMessageRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: "Invalid request.", details: parsed.errors }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { body: reply, commit } = await processAdvisorMessage(parsed.value, {
      provider: getAdvisorProvider(),
      store: getAdvisorStore(),
    });
    // Saving the turn and the lead doesn't hold up the reply.
    after(async () => {
      try {
        await commit();
      } catch (cause) {
        console.error(`Roofing Advisor: couldn't save the turn (${cause instanceof Error ? cause.message : "unknown error"}).`);
      }
    });
    return Response.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error(`Roofing Advisor: the turn failed (${cause instanceof Error ? cause.name : "unknown error"}).`);
    return error(500, "Something went wrong on our end.");
  }
}
