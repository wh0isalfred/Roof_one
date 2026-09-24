/** A quiet full-width bar across the top of the advisor. */
export function AdvisorProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const text = `Step ${current} of ${total}`;

  return (
    <div
      role="progressbar"
      aria-label="Assessment progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={text}
      className="h-1 shrink-0 bg-subtle"
    >
      <div
        className="h-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}
