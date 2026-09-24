"use client";

import { ArrowLeft } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button, ButtonArrow } from "@/components/ui/Button";
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
import { cn } from "@/lib/cn";
import { isOptionValue } from "@/lib/options";
import { AdvisorInput } from "./AdvisorInput";
import { AdvisorMessage } from "./AdvisorMessage";
import { AdvisorOption } from "./AdvisorOption";
import { AdvisorProgress } from "./AdvisorProgress";
import { AdvisorSummary } from "./AdvisorSummary";
import { AdvisorUpload } from "./AdvisorUpload";
import { IssueSelector } from "./IssueSelector";

const steps = ADVISOR_STEPS;

/** How long a chosen answer stays on screen before the next question replaces it. */
const ADVANCE_DELAY_MS = 280;

function getFirstOpenStepIndex(answers: AssessmentAnswers): number {
  const index = steps.findIndex((step) => !isStepComplete(step, answers));
  return index === -1 ? 0 : index;
}

/** "01", "02", … for the step counter. */
function stepNumber(value: number): string {
  return String(value).padStart(2, "0");
}

interface NextAction {
  label: string;
  onClick?: () => void;
  /** Submits the step's form, so required fields are checked first. */
  submitsForm?: boolean;
  disabled?: boolean;
  /** Id of text that explains the action, e.g. why it's unavailable. */
  describedBy?: string;
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
 *
 * It fills its container: progress on top, the question in a scrolling
 * middle, and Back / Continue pinned to the bottom so they're never hunted for.
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
  // The step a just-chosen answer moves on to, once its pause is over.
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFocusedStep = useRef<number | null>(
    focusOnMount ? null : stepIndex,
  );
  const baseId = useId();
  const formId = `${baseId}-form`;
  const noticeId = `${baseId}-notice`;

  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    if (lastFocusedStep.current === stepIndex) return;
    lastFocusedStep.current = stepIndex;
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [stepIndex]);

  // Leave a chosen answer on screen for a beat so it registers, then move on.
  // Clearing pendingStep (any other move, or unmounting) cancels the timer.
  useEffect(() => {
    if (pendingStep === null) return;
    const timer = setTimeout(() => {
      setPendingStep(null);
      setStepIndex(pendingStep);
    }, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pendingStep]);

  const clampStep = (index: number) =>
    Math.min(Math.max(index, 0), steps.length - 1);
  // Every move cancels a pending auto-advance, so Back or Continue during the
  // pause after a choice never skips a step.
  const goTo = (index: number) => {
    setPendingStep(null);
    setStepIndex(clampStep(index));
  };
  const goNext = () => goTo(stepIndex + 1);
  const goBack = stepIndex > 0 ? () => goTo(stepIndex - 1) : undefined;
  const goToStep = (id: AdvisorStepId) =>
    goTo(steps.findIndex((candidate) => candidate.id === id));

  const hasProgress =
    stepIndex > 0 || photos.length > 0 || Object.keys(answers).length > 0;

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
    setPendingStep(clampStep(stepIndex + 1));
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
        return step.field === "issue_type" ? (
          <IssueSelector
            value={answers.issue_type}
            onSelect={(issue) => choose("issue_type", issue)}
          />
        ) : (
          <ul
            className={cn(
              "grid gap-3",
              step.options.length > 3 && "sm:grid-cols-2",
            )}
          >
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
        );

      case "fields":
        return (
          <form
            id={formId}
            onSubmit={handleFieldsSubmit}
            className="grid max-w-xl gap-6"
          >
            {step.fields.map(renderField)}
          </form>
        );

      case "photos":
        return (
          <div className="max-w-xl">
            <AdvisorUpload
              id={`${baseId}-photos`}
              files={photos}
              onChange={setPhotos}
            />
          </div>
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
            <p
              id={noticeId}
              className="mt-8 max-w-md rounded-md bg-surface px-5 py-4 leading-relaxed text-ink-muted"
            >
              Online requests aren’t connected yet. For now, call us at{" "}
              <a
                href={siteConfig.phone.href}
                className="font-semibold text-ink underline underline-offset-4"
              >
                {siteConfig.phone.display}
              </a>{" "}
              and we’ll take it from here.
            </p>
          </>
        );
    }
  }

  function getNextAction(): NextAction {
    switch (step.kind) {
      case "choice":
        // Choosing an answer moves on by itself; Continue covers a question
        // that's already answered, e.g. after going back.
        return {
          label: "Continue",
          onClick: goNext,
          disabled: answers[step.field] === undefined,
        };
      case "fields":
        return { label: "Continue", submitsForm: true };
      case "photos":
        return {
          label: photos.length > 0 ? "Continue" : "Skip for now",
          onClick: goNext,
        };
      case "review":
        // Lead creation (Supabase) gets wired here in the next stage.
        return { label: "Send my request", disabled: true, describedBy: noticeId };
    }
  }

  return (
    <div className="flex h-full flex-col">
      <AdvisorProgress current={stepIndex + 1} total={steps.length} />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          key={stepIndex}
          className="mx-auto w-full max-w-3xl animate-[step-in_0.35s_ease-out_both] px-5 pt-8 pb-14 motion-reduce:animate-none sm:px-8 sm:pt-12 lg:pt-16"
        >
          <div className="flex h-10 items-center justify-between gap-4">
            <p
              aria-hidden="true"
              className="text-sm font-semibold text-ink-muted tabular-nums"
            >
              <span className="text-brand">{stepNumber(stepIndex + 1)}</span>
              {" / "}
              {stepNumber(steps.length)}
            </p>
            {hasProgress && (
              <button
                type="button"
                onClick={restart}
                className="-mr-3 flex h-10 items-center rounded-md px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
              >
                Start over
              </button>
            )}
          </div>
          <AdvisorMessage
            ref={headingRef}
            title={step.title}
            helper={step.helper}
          />
          <div className="mt-8 sm:mt-10">{renderStep()}</div>
        </div>
      </div>

      <StepActions
        onBack={goBack}
        next={getNextAction()}
        formId={formId}
      />
    </div>
  );
}

function StepActions({
  onBack,
  next,
  formId,
}: {
  onBack?: () => void;
  next: NextAction;
  /** The form a submitting Continue belongs to; the bar sits outside it. */
  formId: string;
}) {
  return (
    <div className="shrink-0 border-t border-line bg-canvas">
      <div className="mx-auto flex h-20 w-full max-w-3xl items-center justify-between gap-3 px-5 sm:px-8">
        {onBack ? (
          <Button variant="outline" size="lg" onClick={onBack}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          size="lg"
          type={next.submitsForm ? "submit" : "button"}
          form={next.submitsForm ? formId : undefined}
          onClick={next.onClick}
          disabled={next.disabled}
          aria-describedby={next.describedBy}
        >
          {next.label}
          <ButtonArrow />
        </Button>
      </div>
    </div>
  );
}
