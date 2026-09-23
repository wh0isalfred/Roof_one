import { ChevronDown } from "lucide-react";
import type { Option } from "@/lib/options";

interface AdvisorInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "tel" | "email" | "date" | "textarea" | "select";
  /** Choices for `type="select"`. */
  options?: readonly Option[];
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}

// 16px text keeps iOS from zooming in when a field is focused.
const controlClasses =
  "mt-2 block w-full rounded-md border border-control bg-surface px-3.5 text-base text-ink";

/** A labeled text field, textarea, or dropdown for an advisor step. */
export function AdvisorInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  options = [],
  required = false,
  autoComplete,
  inputMode,
}: AdvisorInputProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {!required && (
          <span className="font-normal text-ink-muted"> (optional)</span>
        )}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          rows={5}
          className={`${controlClasses} py-3`}
        />
      ) : type === "select" ? (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            className={`${controlClasses} h-12 appearance-none pr-10`}
          >
            <option value="">Choose one</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-muted"
          />
        </div>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`${controlClasses} h-12`}
        />
      )}
    </div>
  );
}
