import type { PolicyTopic } from "@/lib/roofing-advisor/types";
import { siteConfig } from "./site";

/**
 * Company facts the Roofing Advisor may state. Anything left null, the
 * advisor never answers on its own: it says the team will confirm and passes
 * the question along. Fill these in only with details the company has
 * confirmed.
 */
export interface AdvisorBusinessConfig {
  /** e.g. "Monday to Friday, 8am to 6pm". Shown when someone asks for a person. */
  hours: string | null;
  phoneDisplay: string;
  phoneHref: `tel:${string}`;
  /** One or two plain sentences per topic, written as the advisor would say them. */
  policies: Record<PolicyTopic, string | null>;
}

export const advisorConfig: AdvisorBusinessConfig = {
  hours: null,
  phoneDisplay: siteConfig.phone.display,
  phoneHref: siteConfig.phone.href,
  policies: {
    insurance: null,
    financing: null,
    service_area: null,
    availability: null,
    hours: null,
    warranty: null,
    licensing: null,
    experience: null,
    inspection_fee: null,
  },
};
