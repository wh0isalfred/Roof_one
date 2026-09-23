import type {
  ContactMethod,
  IssueType,
  RoofAge,
  RoofType,
  TimeWindow,
  Urgency,
} from "@/lib/leads/options";
import type { Option } from "@/lib/options";

/**
 * Everything the Roofing Advisor collects before a lead is created. Keys match
 * `leads` columns (plus `appointments.requested_date`), so creating the lead
 * is a direct mapping. Photos are kept separately as files until uploaded.
 */
export interface AssessmentAnswers {
  issue_type?: IssueType;
  urgency?: Urgency;
  roof_age?: RoofAge;
  roof_type?: RoofType;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  description?: string;
  name?: string;
  phone?: string;
  email?: string;
  requested_date?: string;
  preferred_time?: TimeWindow;
  preferred_contact_method?: ContactMethod;
}

export type AdvisorStepId =
  | "issue"
  | "urgency"
  | "roof_age"
  | "roof_type"
  | "property"
  | "description"
  | "photos"
  | "name"
  | "phone"
  | "email"
  | "appointment"
  | "review";

/** Answers chosen from a list of options. */
export type ChoiceField = "issue_type" | "urgency" | "roof_age" | "roof_type";

/** Answers typed as free text. */
export type TextField =
  | "address"
  | "city"
  | "state"
  | "zip_code"
  | "description"
  | "name"
  | "phone"
  | "email"
  | "requested_date";

/** Answers chosen from a dropdown inside a multi-field step. */
export type SelectField = "preferred_time" | "preferred_contact_method";

type OptionsFor<F extends ChoiceField | SelectField> = readonly Option<
  NonNullable<AssessmentAnswers[F]>
>[];

interface StepBase {
  id: AdvisorStepId;
  /** Short name used in the review summary. */
  label: string;
  /** The question the advisor asks. */
  title: string;
  helper?: string;
}

export type ChoiceStep = {
  [F in ChoiceField]: StepBase & {
    kind: "choice";
    field: F;
    options: OptionsFor<F>;
  };
}[ChoiceField];

export interface TextInputField {
  kind: "text";
  name: TextField;
  label: string;
  type: "text" | "tel" | "email" | "date" | "textarea";
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}

export type SelectInputField = {
  [F in SelectField]: {
    kind: "select";
    name: F;
    label: string;
    required?: boolean;
    options: OptionsFor<F>;
  };
}[SelectField];

export type AdvisorField = TextInputField | SelectInputField;

export interface FieldsStep extends StepBase {
  kind: "fields";
  fields: readonly AdvisorField[];
}

export interface PhotosStep extends StepBase {
  kind: "photos";
}

export interface ReviewStep extends StepBase {
  kind: "review";
}

export type AdvisorStep = ChoiceStep | FieldsStep | PhotosStep | ReviewStep;
