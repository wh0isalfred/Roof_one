import "server-only";
import { createClient } from "@supabase/supabase-js";
import { MemoryAdvisorStore } from "./memory";
import { SupabaseAdvisorStore } from "./supabase";
import type { AdvisorStore } from "./types";

const globalForStore = globalThis as typeof globalThis & { __roofingAdvisorStore?: AdvisorStore };

/**
 * Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set; memory
 * otherwise (kept on globalThis so dev reloads don't drop it).
 */
export function getAdvisorStore(): AdvisorStore {
  if (globalForStore.__roofingAdvisorStore) return globalForStore.__roofingAdvisorStore;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const store: AdvisorStore =
    url && key
      ? new SupabaseAdvisorStore(
          createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
        )
      : new MemoryAdvisorStore();

  if (!store.durable && process.env.NODE_ENV === "production") {
    console.warn(
      "Roofing Advisor: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY aren't set, so conversations and leads are only kept in memory.",
    );
  }
  globalForStore.__roofingAdvisorStore = store;
  return store;
}
