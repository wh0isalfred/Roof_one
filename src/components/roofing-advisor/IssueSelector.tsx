import { ISSUE_ICONS } from "@/components/issue-icons";
import { ISSUE_TYPE_OPTIONS, type IssueType } from "@/lib/leads/options";
import { AdvisorOption } from "./AdvisorOption";

interface IssueSelectorProps {
  value?: IssueType;
  onSelect: (issue: IssueType) => void;
}

/** The roofing issue choices: the advisor's first step. */
export function IssueSelector({ value, onSelect }: IssueSelectorProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ISSUE_TYPE_OPTIONS.map((option) => (
        <li key={option.value}>
          <AdvisorOption
            label={option.label}
            description={option.description}
            icon={ISSUE_ICONS[option.value]}
            selected={value === option.value}
            onSelect={() => onSelect(option.value)}
          />
        </li>
      ))}
    </ul>
  );
}
