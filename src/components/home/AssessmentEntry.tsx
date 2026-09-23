"use client";

import { useState } from "react";
import { IssueSelector } from "@/components/roofing-advisor/IssueSelector";
import { RoofingAdvisor } from "@/components/roofing-advisor/RoofingAdvisor";
import type { IssueType } from "@/lib/leads/options";

/** Homepage entry point: pick an issue, then continue in the Roofing Advisor. */
export function AssessmentEntry() {
  const [issue, setIssue] = useState<IssueType | null>(null);

  if (issue === null) {
    return <IssueSelector onSelect={setIssue} />;
  }

  return <RoofingAdvisor initialAnswers={{ issue_type: issue }} focusOnMount />;
}
