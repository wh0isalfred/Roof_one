import { summarizeStep } from "@/lib/advisor/answers";
import type {
  AdvisorStep,
  AdvisorStepId,
  AssessmentAnswers,
} from "@/lib/advisor/types";

interface AdvisorSummaryProps {
  steps: readonly AdvisorStep[];
  answers: AssessmentAnswers;
  photoCount: number;
  onEdit: (stepId: AdvisorStepId) => void;
}

/** Everything the homeowner entered, with a way back to each step. */
export function AdvisorSummary({
  steps,
  answers,
  photoCount,
  onEdit,
}: AdvisorSummaryProps) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {steps
        .filter((step) => step.kind !== "review")
        .map((step) => (
          <div
            key={step.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)_auto]"
          >
            <dt className="text-sm font-semibold">{step.label}</dt>
            <dd className="col-start-1 text-ink-muted sm:col-start-2 sm:row-start-1">
              {summarizeStep(step, answers, photoCount) ?? "Not provided"}
            </dd>
            <dd className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1">
              <button
                type="button"
                onClick={() => onEdit(step.id)}
                className="flex h-10 items-center rounded-md px-3 text-sm font-semibold text-brand hover:bg-subtle"
              >
                Edit<span className="sr-only"> {step.label}</span>
              </button>
            </dd>
          </div>
        ))}
    </dl>
  );
}
