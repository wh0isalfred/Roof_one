import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { RoofingAdvisorProvider } from "../provider";
import { AnthropicAdvisorProvider, DEFAULT_ADVISOR_MODEL } from "./anthropic";

let cached: RoofingAdvisorProvider | null | undefined;

/**
 * The configured AI provider, or null to use the built-in local advisor.
 *
 * Set ANTHROPIC_API_KEY to turn on Claude. ROOFING_ADVISOR_MODEL overrides the
 * model; ROOFING_ADVISOR_PROVIDER=local forces the local advisor.
 */
export function getAdvisorProvider(): RoofingAdvisorProvider | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || process.env.ROOFING_ADVISOR_PROVIDER === "local") {
    cached = null;
    return cached;
  }
  cached = new AnthropicAdvisorProvider({
    client: new Anthropic({ apiKey }),
    model: process.env.ROOFING_ADVISOR_MODEL || DEFAULT_ADVISOR_MODEL,
  });
  return cached;
}
