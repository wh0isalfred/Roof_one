interface AdvisorSuggestionsProps {
  suggestions: readonly string[];
  /** Sends the suggestion as the homeowner's own message. */
  onSelect: (text: string) => void;
  disabled?: boolean;
}

/** Optional quick replies. Tapping one sends it as a normal message; typing always works too. */
export function AdvisorSuggestions({ suggestions, onSelect, disabled = false }: AdvisorSuggestionsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Suggested replies"
      className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
