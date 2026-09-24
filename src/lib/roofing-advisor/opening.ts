import type { IssueType } from "@/lib/leads/options";

/*
 * How a conversation opens. Small and dependency-free so the chat UI can use
 * it without loading the engine.
 */

export function stableHash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable pick from `options` for a given seed. */
export function pick<T>(options: readonly T[], seed: string): T {
  if (options.length === 0) throw new Error("pick() needs at least one option");
  return options[stableHash(seed) % options.length] as T;
}

export const GREETINGS = [
  "Hey — what's going on with your roof?",
  "Hi there. What's going on with the roof?",
  "Hey! What's happening with your roof?",
] as const;

export const OPENING_SUGGESTIONS = [
  "It's leaking",
  "Storm damage",
  "I need a replacement",
  "I'm not sure",
] as const;

export function greetingFor(conversationId: string): string {
  return pick(GREETINGS, `${conversationId}:greeting`);
}

/**
 * What the homeowner "says" when they start from a homepage shortcut like
 * "Leaking". It's sent as their first message, never applied silently.
 */
export const ISSUE_OPENERS: Record<IssueType, string> = {
  leak: "It's leaking",
  storm_damage: "We had storm damage",
  repair: "I need a repair",
  replacement: "I think I need a new roof",
  inspection: "I'd like an inspection",
  not_sure: "I'm not sure what's wrong",
};
