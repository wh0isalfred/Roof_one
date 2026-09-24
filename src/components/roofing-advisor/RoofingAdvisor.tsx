"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { isStepComplete, setAnswer } from "@/lib/advisor/answers";
import { ADVISOR_STEPS } from "@/lib/advisor/steps";
import type {
  AdvisorField,
  AdvisorStepId,
  AssessmentAnswers,
  ChoiceField,
  SelectInputField,
} from "@/lib/advisor/types";
import { isOptionValue } from "@/lib/options";
import { AdvisorInput } from "./AdvisorInput";
import { AdvisorMessage } from "./AdvisorMessage";
import { AdvisorOption } from "./AdvisorOption";
import { AdvisorProgress } from "./AdvisorProgress";
import { AdvisorSummary } from "./AdvisorSummary";
import { AdvisorUpload } from "./AdvisorUpload";
import { IssueSelector } from "./IssueSelector";

const steps = ADVISOR_STEPS;

function getFirstOpenStepIndex(answers: AssessmentAnswers): number {
  const index = steps.findIndex((step) => !isStepComplete(step, answers));
  return index === -1 ? 0 : index;
}

interface RoofingAdvisorProps {
  /** Answers already known, e.g. the issue picked on the homepage. The advisor opens at the first unanswered step. */
  initialAnswers?: AssessmentAnswers;
  /** Move focus to the first question on mount. Use when the advisor appears in response to a click. */
  focusOnMount?: boolean;
}

/**
 * The guided roof assessment. This is the component shell: it walks through
 * the scripted steps with local state. Lead creation, photo upload and any AI
 * assistance get connected in later stages, outside this component.
 */
export function RoofingAdvisor({
  initialAnswers = {},
  focusOnMount = false,
}: RoofingAdvisorProps) {
  const [answers, setAnswers] = useState<AssessmentAnswers>(initialAnswers);
  const [photos, setPhotos] = useState<File[]>([]);
  const [stepIndex, setStepIndex] = useState(() =>
    getFirstOpenStepIndex(initialAnswers),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastFocusedStep = useRef<number | null>(
    focusOnMount ? null : stepIndex,
  );
  const baseId = useId();

  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    if (lastFocusedStep.current === stepIndex) return;
    lastFocusedStep.current = stepIndex;
    headingRef.current?.focus();
  }, [stepIndex]);

  const goTo = (index: number) =>
    setStepIndex(Math.min(Math.max(index, 0), steps.length - 1));
  const goNext = () => goTo(stepIndex + 1);
  const goBack = stepIndex > 0 ? () => goTo(stepIndex - 1) : undefined;
  const goToStep = (id: AdvisorStepId) =>
    goTo(steps.findIndex((candidate) => candidate.id === id));

  function restart() {
    setAnswers({});
    setPhotos([]);
    goTo(0);
  }

  function choose<F extends ChoiceField>(
    field: F,
    value: NonNullable<AssessmentAnswers[F]>,
  ) {
    setAnswers((current) => setAnswer(current, field, value));
    goNext();
  }

  function chooseFromSelect(field: SelectInputField, value: string) {
    if (value === "") {
      setAnswers((current) => setAnswer(current, field.name, undefined));
    } else if (isOptionValue(field.options, value)) {
      setAnswers((current) => setAnswer(current, field.name, value));
    }
  }

  function handleFieldsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goNext();
  }

  function renderField(field: AdvisorField) {
    const id = `${baseId}-${field.name}`;

    if (field.kind === "select") {
      return (
        <AdvisorInput
          key={field.name}
          id={id}
          type="select"
          label={field.label}
          options={field.options}
          required={field.required}
          value={answers[field.name] ?? ""}
          onChange={(value) => chooseFromSelect(field, value)}
        />
      );
    }

    return (
      <AdvisorInput
        key={field.name}
        id={id}
        type={field.type}
        label={field.label}
        required={field.required}
        autoComplete={field.autoComplete}
        inputMode={field.inputMode}
        value={answers[field.name] ?? ""}
        onChange={(value) =>
          setAnswers((current) => setAnswer(current, field.name, value))
        }
      />
    );
  }

  function renderStep(): ReactNode {
    switch (step.kind) {
      case "choice":
        return (
          <>
            {step.field === "issue_type" ? (
              <IssueSelector
                value={answers.issue_type}
                onSelect={(issue) => choose("issue_type", issue)}
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {step.options.map((option) => (
                  <li key={option.value}>
                    <AdvisorOption
                      label={option.label}
                      description={option.description}
                      selected={answers[step.field] === option.value}
                      onSelect={() => choose(step.field, option.value)}
                    />
                  </li>
                ))}
              </ul>
            )}
            <StepActions onBack={goBack} />
          </>
        );

      case "fields":
        return (
          <form onSubmit={handleFieldsSubmit}>
            <div className="grid max-w-xl gap-5">{step.fields.map(renderField)}</div>
            <StepActions onBack={goBack} continueLabel="Continue" />
          </form>
        );

      case "photos":
        return (
          <>
            <div className="max-w-xl">
              <AdvisorUpload
                id={`${baseId}-photos`}
                files={photos}
                onChange={setPhotos}
              />
            </div>
            <StepActions
              onBack={goBack}
              onContinue={goNext}
              continueLabel={photos.length > 0 ? "Continue" : "Skip for now"}
            />
          </>
        );

      case "review":
        return (
          <>
            <AdvisorSummary
              steps={steps}
              answers={answers}
              photoCount={photos.length}
              onEdit={goToStep}
            />
            <div className="mt-8">
              {/* Lead creation (Supabase) gets wired here in the next stage. */}
              <Button variant="accent" size="lg" disabled>
                Send my request
              </Button>
              <p className="mt-3 text-sm text-ink-muted">
                Online requests aren’t connected yet. For now, call us at{" "}
                <a
                  href={siteConfig.phone.href}
                  className="font-semibold text-ink underline underline-offset-4"
                >
                  {siteConfig.phone.display}
                </a>{" "}
                and we’ll take it from here.
              </p>
            </div>
            <StepActions onBack={goBack} />
          </>
        );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
        <AdvisorProgress current={stepIndex + 1} total={steps.length} />
        <button
          type="button"
          onClick={restart}
          className="flex h-10 items-center rounded-md px-3 text-sm font-semibold text-ink-muted hover:bg-subtle hover:text-ink"
        >
          Start over
        </button>
      </div>
      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <AdvisorMessage ref={headingRef} title={step.title} helper={step.helper} />
        <div className="mt-8">{renderStep()}</div>
      </div>
    </div>
  );
}

function StepActions({
  onBack,
  onContinue,
  continueLabel,
}: {
  onBack?: () => void;
  /** Without a handler, the continue button submits the surrounding form. */
  onContinue?: () => void;
  continueLabel?: string;
}) {
  if (!onBack && !continueLabel) return null;

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back
        </Button>
      ) : (
        <span />
      )}
      {continueLabel && (
        <Button type={onContinue ? "button" : "submit"} onClick={onContinue}>
          {continueLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      )}
    </div>
  );
}
