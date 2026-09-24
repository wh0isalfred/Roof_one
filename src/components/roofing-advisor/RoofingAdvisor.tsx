"use client";

import type { IssueType } from "@/lib/leads/options";
import { AdvisorChat } from "./AdvisorChat";

interface RoofingAdvisorProps {
  initialAnswers?: { issue_type?: IssueType };
  focusOnMount?: boolean;
  onClose?: () => void;
}

export function RoofingAdvisor({ initialAnswers, focusOnMount, onClose }: RoofingAdvisorProps) {
  return (
    <AdvisorChat initialIssue={initialAnswers?.issue_type} onClose={onClose} focusOnMount={focusOnMount} />
  );
}
