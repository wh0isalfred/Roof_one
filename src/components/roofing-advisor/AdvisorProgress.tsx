export function AdvisorProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const text = `Step ${current} of ${total}`;

  return (
    <div className="min-w-0 flex-1">
      <p aria-hidden="true" className="text-xs font-semibold tracking-eyebrow text-ink-muted uppercase">
        {text}
      </p>
      <div
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={text}
        className="mt-2 h-1 max-w-xs bg-subtle"
      >
        <div
          className="h-full bg-brand transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
