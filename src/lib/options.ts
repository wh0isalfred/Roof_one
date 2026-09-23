/**
 * A selectable value with its human-readable copy. Option lists are the single
 * source for both the allowed values (types are derived from them) and the
 * labels shown in the UI.
 */
export interface Option<T extends string = string> {
  readonly value: T;
  readonly label: string;
  readonly description?: string;
}

export function getOptionLabel<T extends string>(
  options: readonly Option<T>[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function isOptionValue<T extends string>(
  options: readonly Option<T>[],
  value: string,
): value is T {
  return options.some((option) => option.value === value);
}
