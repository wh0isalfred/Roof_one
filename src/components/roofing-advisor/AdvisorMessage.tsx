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
    <div className="mt-4 sm:mt-5">
      <h3
        ref={ref}
        tabIndex={-1}
        className="font-headline text-[2rem] leading-[1.06] outline-none sm:text-[2.5rem] lg:text-[2.75rem]"
      >
        {title}
      </h3>
      {helper && (
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{helper}</p>
      )}
    </div>
  );
}
