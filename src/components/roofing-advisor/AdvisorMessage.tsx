import type { Ref } from "react";

interface AdvisorMessageProps {
  title: string;
  helper?: string;
  /** Receives focus when the step changes, so keyboard and screen reader users land on the new question. */
  ref?: Ref<HTMLHeadingElement>;
}

/** The advisor's question for the current step. */
export function AdvisorMessage({ title, helper, ref }: AdvisorMessageProps) {
  return (
    <div>
      <h3
        ref={ref}
        tabIndex={-1}
        className="font-display text-2xl font-bold tracking-tight outline-none sm:text-3xl"
      >
        {title}
      </h3>
      {helper && <p className="mt-2 text-ink-muted">{helper}</p>}
    </div>
  );
}
