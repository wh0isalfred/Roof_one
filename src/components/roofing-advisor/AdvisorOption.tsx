import { Check, type LucideIcon } from "lucide-react";

interface AdvisorOptionProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onSelect: () => void;
}

/** One answer in a list of choices. Choosing it answers the question. */
export function AdvisorOption({
  label,
  description,
  icon: Icon,
  selected = false,
  onSelect,
}: AdvisorOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="flex h-full w-full items-start gap-4 rounded-md border border-line bg-surface p-4 text-left transition-colors hover:border-control aria-pressed:border-brand aria-pressed:bg-brand-soft sm:p-5"
    >
      {Icon && (
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {description && (
          <span className="mt-1 block text-sm text-ink-muted">
            {description}
          </span>
        )}
      </span>
      {selected && (
        <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
      )}
    </button>
  );
}
