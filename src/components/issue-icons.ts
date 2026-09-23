import {
  ClipboardCheck,
  CircleHelp,
  CloudLightning,
  Droplets,
  Hammer,
  HousePlus,
  type LucideIcon,
} from "lucide-react";
import type { IssueType } from "@/lib/leads/options";

export const ISSUE_ICONS: Record<IssueType, LucideIcon> = {
  leak: Droplets,
  storm_damage: CloudLightning,
  repair: Hammer,
  replacement: HousePlus,
  inspection: ClipboardCheck,
  not_sure: CircleHelp,
};
