"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  preparePhoto,
  replyDelay,
  sendAdvisorMessage,
  uploadAdvisorPhoto,
} from "@/lib/roofing-advisor/client";
import { greetingFor, OPENING_SUGGESTIONS } from "@/lib/roofing-advisor/opening";
import { PHOTO_LIMITS } from "@/lib/roofing-advisor/photos";
import { createAssessment, createContext } from "@/lib/roofing-advisor/state";
import type {
  AdvisorAttachment,
  AdvisorContext,
  AdvisorMessage,
  EstimateResult,
  RoofingAssessment,
} from "@/lib/roofing-advisor/types";

/** A message as the chat shows it: the stored message plus what the UI needs around it. */
export interface ChatMessage extends AdvisorMessage {
  status?: "sending" | "failed";
  /** Local previews for photos the homeowner just picked. */
  previews?: string[];
  estimate?: EstimateResult | null;
  handoff?: boolean;
  requestPhoto?: boolean;
  error?: string;
}

interface Conversation {
  id: string;
  messages: ChatMessage[];
  assessment: RoofingAssessment;
  context: AdvisorContext;
  suggestions: string[];
}

function newConversation(): Conversation {
  const id = crypto.randomUUID();
  return {
    id,
    messages: [
      {
        id: crypto.randomUUID(),
        role: "advisor",
        content: greetingFor(id),
        created_at: new Date().toISOString(),
        goal: "identify_issue",
      },
    ],
    assessment: createAssessment(),
    context: createContext(),
    suggestions: [...OPENING_SUGGESTIONS],
  };
}

function toWire({ id, role, content, created_at, goal, attachments }: ChatMessage): AdvisorMessage {
  return { id, role, content, created_at, goal: goal ?? null, attachments: attachments ?? [] };
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const HISTORY_SENT = 60;

/**
 * The chat's state. Every homeowner action, including a tapped suggestion,
 * becomes a real message sent to the advisor; nothing changes state silently.
 */
export function useAdvisorConversation({ initialMessage }: { initialMessage?: string } = {}) {
  const [conversation, setConversation] = useState(newConversation);
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState(false);

  const latest = useRef(conversation);
  const busy = useRef(false);
  const photosForRetry = useRef(new Map<string, File[]>());
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    latest.current = conversation;
  }, [conversation]);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setConversation((current) => ({
      ...current,
      messages: current.messages.map((message) => (message.id === id ? { ...message, ...patch } : message)),
    }));
  }, []);

  /** Sends one homeowner message (already on screen) and shows the reply. */
  const deliver = useCallback(
    async (userMessage: ChatMessage, attachments: AdvisorAttachment[]) => {
      const snapshot = latest.current;
      // The server reads the latest 60 messages; sending more only grows the request.
      const history = snapshot.messages
        .filter((message) => message.id !== userMessage.id && message.status !== "failed")
        .slice(-HISTORY_SENT)
        .map(toWire);
      const typingTimer = window.setTimeout(() => setTyping(true), 250);
      const started = performance.now();
      try {
        const result = await sendAdvisorMessage({
          conversationId: snapshot.id,
          messageId: userMessage.id,
          message: userMessage.content,
          assessment: snapshot.assessment,
          context: snapshot.context,
          history,
          attachments,
        });
        const wait = replyDelay(result.message.content) - (performance.now() - started);
        if (wait > 0) await sleep(wait);
        setConversation((current) => {
          if (current.id !== snapshot.id) return current;
          return {
            ...current,
            messages: [
              ...current.messages.map((message) =>
                message.id === userMessage.id ? { ...message, status: undefined, error: undefined } : message,
              ),
              {
                ...result.message,
                estimate: result.estimate,
                handoff: result.response.handoff,
                requestPhoto: result.response.request_photo,
              },
            ],
            assessment: result.assessment,
            context: result.context,
            suggestions: result.response.suggestions ?? [],
          };
        });
      } catch {
        updateMessage(userMessage.id, { status: "failed", error: "Didn't send." });
      } finally {
        window.clearTimeout(typingTimer);
        setTyping(false);
      }
    },
    [updateMessage],
  );

  const run = useCallback(async (task: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await task();
    } finally {
      busy.current = false;
      setPending(false);
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || busy.current) return;
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
        status: "sending",
      };
      setConversation((current) => ({ ...current, messages: [...current.messages, message], suggestions: [] }));
      void run(() => deliver(message, []));
    },
    [deliver, run],
  );

  const uploadAndDeliver = useCallback(
    async (message: ChatMessage, files: File[]) => {
      const conversationId = latest.current.id;
      let attachments: AdvisorAttachment[];
      try {
        attachments = [];
        for (const file of files) {
          attachments.push(await uploadAdvisorPhoto(conversationId, await preparePhoto(file), file.name));
        }
      } catch {
        photosForRetry.current.set(message.id, files);
        updateMessage(message.id, { status: "failed", error: "Photo didn't upload." });
        return;
      }
      photosForRetry.current.delete(message.id);
      updateMessage(message.id, { attachments });
      await deliver({ ...message, attachments }, attachments);
    },
    [deliver, updateMessage],
  );

  const sendPhotos = useCallback(
    (picked: File[]) => {
      if (busy.current) return;
      const files = picked
        .filter((file) => file.type.startsWith("image/") || /\.(?:heic|heif)$/i.test(file.name))
        .slice(0, PHOTO_LIMITS.perMessage);
      if (files.length === 0) return;
      const previews = files.map((file) => URL.createObjectURL(file));
      previewUrls.current.push(...previews);
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: "",
        created_at: new Date().toISOString(),
        status: "sending",
        previews,
        attachments: [],
      };
      setConversation((current) => ({ ...current, messages: [...current.messages, message], suggestions: [] }));
      void run(() => uploadAndDeliver(message, files));
    },
    [run, uploadAndDeliver],
  );

  const retry = useCallback(
    (id: string) => {
      const message = latest.current.messages.find((candidate) => candidate.id === id);
      if (!message || message.status !== "failed" || busy.current) return;
      updateMessage(id, { status: "sending", error: undefined });
      const files = photosForRetry.current.get(id);
      void run(() => (files ? uploadAndDeliver(message, files) : deliver(message, message.attachments ?? [])));
    },
    [deliver, run, updateMessage, uploadAndDeliver],
  );

  const restart = useCallback(() => {
    if (busy.current) return;
    photosForRetry.current.clear();
    setConversation(newConversation());
  }, []);

  // A homepage shortcut ("Leaking") arrives as the homeowner's first message,
  // a moment after the greeting.
  const openedWith = useRef(false);
  useEffect(() => {
    if (!initialMessage || openedWith.current) return;
    const timer = window.setTimeout(() => {
      openedWith.current = true;
      send(initialMessage);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [initialMessage, send]);

  return {
    conversation,
    typing,
    pending,
    send,
    sendPhotos,
    retry,
    restart,
  };
}
