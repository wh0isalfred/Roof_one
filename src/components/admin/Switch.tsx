interface SwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  /** Id of the element that describes the setting. */
  describedBy?: string;
}

/** An on/off setting. Label it with a <label htmlFor={id}>. */
export function Switch({ id, checked, disabled, describedBy }: SwitchProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <input
        id={id}
        type="checkbox"
        role="switch"
        defaultChecked={checked}
        disabled={disabled}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="h-6 w-11 rounded-full bg-control peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:opacity-60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white peer-checked:translate-x-5"
      />
    </span>
  );
}
