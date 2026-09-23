import { formatCalendarDate } from "@/lib/format";
import { getOptionLabel } from "@/lib/options";
import type { AdvisorField, AdvisorStep, AssessmentAnswers } from "./types";

export function setAnswer<F extends keyof AssessmentAnswers>(
  answers: AssessmentAnswers,
  field: F,
  value: AssessmentAnswers[F],
): AssessmentAnswers {
  return { ...answers, [field]: value };
}

function hasValue(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== "";
}

/** Whether a step's required answers are filled in. Photos and review always need a visit. */
export function isStepComplete(
  step: AdvisorStep,
  answers: AssessmentAnswers,
): boolean {
  switch (step.kind) {
    case "choice":
      return answers[step.field] !== undefined;
    case "fields":
      return step.fields.every(
        (field) => !field.required || hasValue(answers[field.name]),
      );
    case "photos":
    case "review":
      return false;
  }
}

function formatField(
  field: AdvisorField,
  answers: AssessmentAnswers,
): string | null {
  if (field.kind === "select") {
    const value = answers[field.name];
    return value ? getOptionLabel(field.options, value) : null;
  }

  const value = answers[field.name]?.trim();
  if (!value) return null;
  return field.type === "date" ? formatCalendarDate(value) : value;
}

/** A one-line, human-readable version of a step's answers for the review screen. */
export function summarizeStep(
  step: AdvisorStep,
  answers: AssessmentAnswers,
  photoCount: number,
): string | null {
  switch (step.kind) {
    case "choice": {
      const value = answers[step.field];
      return value ? getOptionLabel(step.options, value) : null;
    }
    case "fields": {
      const parts = step.fields
        .map((field) => formatField(field, answers))
        .filter((part): part is string => part !== null);
      return parts.length > 0 ? parts.join(", ") : null;
    }
    case "photos":
      return photoCount > 0
        ? `${photoCount} photo${photoCount === 1 ? "" : "s"}`
        : null;
    case "review":
      return null;
  }
}
