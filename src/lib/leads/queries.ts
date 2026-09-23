import { cache } from "react";
import {
  PLACEHOLDER_APPOINTMENTS,
  PLACEHOLDER_EVENTS,
  PLACEHOLDER_LEADS,
  PLACEHOLDER_MESSAGES,
  PLACEHOLDER_PHOTOS,
} from "@/lib/placeholder-data";
import type { LeadStatus } from "./options";
import type { Lead, LeadDetail } from "./types";

/*
 * Lead data access. Pages read leads only through these functions, so
 * switching from placeholder data to Supabase happens here without touching
 * the UI. They're async because the Supabase versions will be.
 */

export interface LeadFilters {
  status?: LeadStatus;
  search?: string;
  limit?: number;
}

function byNewestFirst(a: { created_at: string }, b: { created_at: string }) {
  return b.created_at.localeCompare(a.created_at);
}

function byOldestFirst(a: { created_at: string }, b: { created_at: string }) {
  return a.created_at.localeCompare(b.created_at);
}

function matchesSearch(lead: Lead, search: string): boolean {
  return [lead.name, lead.email, lead.phone, lead.city, lead.zip_code].some(
    (value) => value?.toLowerCase().includes(search),
  );
}

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const search = filters.search?.trim().toLowerCase();

  const leads = PLACEHOLDER_LEADS.filter(
    (lead) =>
      (!filters.status || lead.status === filters.status) &&
      (!search || matchesSearch(lead, search)),
  ).sort(byNewestFirst);

  return filters.limit ? leads.slice(0, filters.limit) : leads;
}

/** Cached per request, so a page and its metadata share one lookup. */
export const getLeadDetail = cache(async function getLeadDetail(
  id: string,
): Promise<LeadDetail | null> {
  const lead = PLACEHOLDER_LEADS.find((candidate) => candidate.id === id);
  if (!lead) return null;

  const belongsToLead = (row: { lead_id: string }) => row.lead_id === id;

  return {
    ...lead,
    messages: PLACEHOLDER_MESSAGES.filter(belongsToLead).sort(byOldestFirst),
    events: PLACEHOLDER_EVENTS.filter(belongsToLead).sort(byOldestFirst),
    photos: PLACEHOLDER_PHOTOS.filter(belongsToLead).sort(byOldestFirst),
    appointments:
      PLACEHOLDER_APPOINTMENTS.filter(belongsToLead).sort(byNewestFirst),
  };
});

export async function getLeadCountsByStatus(): Promise<
  Record<LeadStatus, number>
> {
  const counts: Record<LeadStatus, number> = {
    new: 0,
    contacted: 0,
    appointment: 0,
    estimate: 0,
    won: 0,
    lost: 0,
  };

  for (const lead of PLACEHOLDER_LEADS) counts[lead.status] += 1;
  return counts;
}
