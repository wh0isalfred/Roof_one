import { ArrowLeft, Mail, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadPriorityBadge, LeadStatusBadge } from "@/components/admin/LeadBadges";
import { LeadConversation } from "@/components/admin/LeadConversation";
import { LeadNotes } from "@/components/admin/LeadNotes";
import { LeadPhotos } from "@/components/admin/LeadPhotos";
import { LeadTimeline } from "@/components/admin/LeadTimeline";
import { DetailList, Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import {
  getLeadAutomationState,
  LEAD_AUTOMATION_STATE_LABELS,
} from "@/lib/automation/actions";
import { getAutomationSettings } from "@/lib/automation/queries";
import {
  formatCalendarDate,
  formatDateTime,
  formatLeadReference,
} from "@/lib/format";
import {
  APPOINTMENT_STATUS_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  ROOF_AGE_OPTIONS,
  ROOF_TYPE_OPTIONS,
  TIME_WINDOW_OPTIONS,
  URGENCY_OPTIONS,
} from "@/lib/leads/options";
import { getLeadPriority } from "@/lib/leads/priority";
import { getLeadDetail } from "@/lib/leads/queries";
import { getOptionLabel, type Option } from "@/lib/options";

/** Label for a nullable option value, or null so DetailList shows a dash. */
function labelOrNull<T extends string>(
  options: readonly Option<T>[],
  value: T | null,
): string | null {
  return value === null ? null : getOptionLabel(options, value);
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/leads/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLeadDetail(id);
  return { title: lead?.name ?? "Lead not found" };
}

export default async function LeadDetailPage({
  params,
}: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;
  const [lead, automationSettings] = await Promise.all([
    getLeadDetail(id),
    getAutomationSettings(),
  ]);

  if (!lead) notFound();

  const appointment = lead.appointments[0];
  const automationState = getLeadAutomationState(automationSettings, lead);
  const streetAddress = lead.address;
  const cityLine = [
    [lead.city, lead.state].filter(Boolean).join(", "),
    lead.zip_code,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All leads
      </Link>

      <div className="mt-4 flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <LeadStatusBadge status={lead.status} />
            <LeadPriorityBadge priority={getLeadPriority(lead)} />
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            {lead.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Lead #{formatLeadReference(lead.id)} · Received{" "}
            <time dateTime={lead.created_at}>
              {formatDateTime(lead.created_at)}
            </time>
          </p>
        </div>

        {/* Actions are wired to Supabase and the email/SMS providers in later stages. */}
        <div className="grid gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <label htmlFor="lead-status" className="text-xs font-semibold text-ink-muted">
                Status
              </label>
              <select
                id="lead-status"
                defaultValue={lead.status}
                disabled
                className="h-11 rounded-md border border-control bg-surface px-3 text-sm disabled:bg-canvas"
              >
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" disabled>
              <Mail aria-hidden="true" className="size-4" />
              Send email
            </Button>
            <Button variant="outline" disabled>
              <MessageSquareText aria-hidden="true" className="size-4" />
              Send text
            </Button>
          </div>
          <p className="text-xs text-ink-muted">
            Actions turn on once the database is connected.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <Panel id="assessment" title="Assessment">
            <DetailList
              items={[
                {
                  label: "Issue",
                  value: getOptionLabel(ISSUE_TYPE_OPTIONS, lead.issue_type),
                },
                {
                  label: "Urgency",
                  value: labelOrNull(URGENCY_OPTIONS, lead.urgency),
                },
                {
                  label: "Roof age",
                  value: labelOrNull(ROOF_AGE_OPTIONS, lead.roof_age),
                },
                {
                  label: "Roof type",
                  value: labelOrNull(ROOF_TYPE_OPTIONS, lead.roof_type),
                },
                { label: "Description", value: lead.description },
              ]}
            />
          </Panel>

          <Panel
            id="photos"
            title="Photos"
            aside={
              <span className="text-xs text-ink-muted">{lead.photos.length}</span>
            }
          >
            <LeadPhotos photos={lead.photos} />
          </Panel>

          <Panel id="conversation" title="Conversation">
            <LeadConversation messages={lead.messages} />
          </Panel>

          <Panel id="activity" title="Activity">
            <LeadTimeline events={lead.events} />
          </Panel>

          <Panel id="notes" title="Notes">
            <LeadNotes leadId={lead.id} events={lead.events} />
          </Panel>
        </div>

        {/* On phones, contact details come first: calling the lead is the main job there. */}
        <div className="order-first grid content-start gap-6 lg:order-none">
          <Panel id="contact" title="Contact">
            <DetailList
              items={[
                {
                  label: "Phone",
                  value: lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                      className="underline underline-offset-4"
                    >
                      {lead.phone}
                    </a>
                  ),
                },
                {
                  label: "Email",
                  value: lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="underline underline-offset-4"
                    >
                      {lead.email}
                    </a>
                  ),
                },
                {
                  label: "Prefers",
                  value: labelOrNull(
                    CONTACT_METHOD_OPTIONS,
                    lead.preferred_contact_method,
                  ),
                },
                {
                  label: "Best time",
                  value: labelOrNull(TIME_WINDOW_OPTIONS, lead.preferred_time),
                },
              ]}
            />
          </Panel>

          <Panel id="property" title="Property">
            {streetAddress || cityLine ? (
              <address className="text-sm not-italic">
                {streetAddress && <span className="block">{streetAddress}</span>}
                {cityLine && <span className="block">{cityLine}</span>}
              </address>
            ) : (
              <p className="text-sm text-ink-muted">No address provided.</p>
            )}
          </Panel>

          <Panel id="appointment" title="Appointment">
            {appointment ? (
              <DetailList
                items={[
                  {
                    label: "Date",
                    value:
                      appointment.requested_date &&
                      formatCalendarDate(appointment.requested_date),
                  },
                  {
                    label: "Time",
                    value: labelOrNull(
                      TIME_WINDOW_OPTIONS,
                      appointment.requested_time,
                    ),
                  },
                  {
                    label: "Status",
                    value: getOptionLabel(
                      APPOINTMENT_STATUS_OPTIONS,
                      appointment.status,
                    ),
                  },
                  { label: "Notes", value: appointment.notes },
                ]}
              />
            ) : (
              <p className="text-sm text-ink-muted">No appointment requested.</p>
            )}
          </Panel>

          <Panel id="automation" title="Automation">
            <p className="text-sm font-semibold">
              {LEAD_AUTOMATION_STATE_LABELS[automationState]}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {automationState === "off" ? (
                <>
                  Automated messages are turned off for everyone in{" "}
                  <Link
                    href="/admin/automation"
                    className="font-semibold text-accent underline-offset-4 hover:underline"
                  >
                    Automation
                  </Link>
                  .
                </>
              ) : automationState === "paused" ? (
                "No automated messages will go to this lead."
              ) : (
                "This lead receives the automated messages that are turned on."
              )}
            </p>
            <Button variant="outline" disabled className="mt-4">
              {lead.automation_enabled
                ? "Pause for this lead"
                : "Resume for this lead"}
            </Button>
          </Panel>
        </div>
      </div>
    </>
  );
}
