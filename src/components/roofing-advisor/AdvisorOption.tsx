import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface AdvisorOptionProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onSelect: () => void;
}

/**
 * One answer in a list of choices. Choosing it answers the question. The
 * chosen answer turns solid blue and gains a check, so it never relies on
 * colour alone.
 */
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
      className={cn(
        "flex h-full min-h-18 w-full items-center gap-4 rounded-md border px-5 py-4 text-left transition-colors duration-150 motion-reduce:transition-none sm:px-6 sm:py-5",
        selected
          ? "border-brand bg-brand text-white"
          : "border-line bg-canvas hover:border-ink/40 hover:bg-surface",
      )}
    >
      {Icon && (
        <Icon
          aria-hidden="true"
          strokeWidth={1.8}
          className={cn("size-6 shrink-0", selected ? "text-white" : "text-brand")}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] leading-snug font-semibold">
          {label}
        </span>
        {description && (
          <span
            className={cn(
              "mt-1 block text-[0.9375rem] leading-snug",
              selected ? "text-white/85" : "text-ink-muted",
            )}
          >
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
          selected ? "border-white bg-white text-brand" : "border-control",
        )}
      >
        {selected && <Check strokeWidth={3} className="size-3.5" />}
      </span>
    </button>
  );
}
