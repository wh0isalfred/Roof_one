import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { MemoryAdvisorStore } from "../store/memory";
import type { AdvisorMessageResponse, AdvisorPhotoUploadResponse } from "../types";

const { afterTasks } = vi.hoisted(() => ({ afterTasks: [] as Array<() => unknown> }));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (task: () => unknown) => afterTasks.push(task) };
});

let messageRoute: typeof import("@/app/api/roofing-advisor/message/route");
let photoRoute: typeof import("@/app/api/roofing-advisor/photos/route");
let store: MemoryAdvisorStore;

beforeAll(async () => {
  // Never call a real AI provider from tests, even with a key in the environment.
  process.env.ROOFING_ADVISOR_PROVIDER = "local";
  messageRoute = await import("@/app/api/roofing-advisor/message/route");
  photoRoute = await import("@/app/api/roofing-advisor/photos/route");
  const { getAdvisorStore } = await import("../store");
  store = getAdvisorStore() as MemoryAdvisorStore;
});

function post(url: string, body: BodyInit, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body,
    headers: { "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200)}`, ...headers },
  });
}

describe("POST /api/roofing-advisor/message", () => {
  it("rejects invalid requests with reasons", async () => {
    const response = await messageRoute.POST(post("/api/roofing-advisor/message", JSON.stringify({ conversationId: "x" })));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { details: string[] };
    expect(body.details).toContain("conversationId must be a UUID.");
  });

  it("replies, then saves the turn after the response", async () => {
    const conversationId = crypto.randomUUID();
    const greeting = { id: crypto.randomUUID(), role: "advisor", content: "Hey — what's going on with your roof?", created_at: new Date(0).toISOString(), goal: "identify_issue" };
    afterTasks.length = 0;
    const response = await messageRoute.POST(
      post(
        "/api/roofing-advisor/message",
        JSON.stringify({ conversationId, messageId: crypto.randomUUID(), message: "My roof leaks in the kitchen.", assessment: {}, history: [greeting] }),
        { "content-type": "application/json" },
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = (await response.json()) as AdvisorMessageResponse;
    expect(body.assessment.intent).toBe("leak");
    expect(body.message.role).toBe("advisor");
    expect(body.message.content).toBe(body.response.reply);
    expect(body.context.turn).toBe(1);
    expect(JSON.stringify(body)).not.toMatch(/api[_-]?key/i);

    expect(store.messagesFor(conversationId)).toHaveLength(0);
    await Promise.all(afterTasks.map((task) => task()));
    expect(store.messagesFor(conversationId).map((message) => message.role)).toEqual(["advisor", "user", "advisor"]);
  });
});

describe("POST /api/roofing-advisor/photos", () => {
  function form(bytes: number[], type: string) {
    const data = new FormData();
    data.set("conversationId", crypto.randomUUID());
    data.append("photos", new File([new Uint8Array(bytes)], "roof.jpg", { type }));
    return data;
  }

  it("accepts a real image, whatever it's called", async () => {
    const response = await photoRoute.POST(post("/api/roofing-advisor/photos", form([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3], "application/octet-stream")));
    expect(response.status).toBe(200);
    const body = (await response.json()) as AdvisorPhotoUploadResponse;
    expect(body.photos[0]).toMatchObject({ kind: "photo", content_type: "image/jpeg", name: "roof.jpg" });
  });

  it("rejects files that aren't images, whatever they claim to be", async () => {
    const response = await photoRoute.POST(post("/api/roofing-advisor/photos", form([0x3c, 0x73, 0x76, 0x67], "image/jpeg")));
    expect(response.status).toBe(415);
  });
});
