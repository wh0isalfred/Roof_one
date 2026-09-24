import {
  detectIntent,
  detectSignals,
  findAffirmed,
  INSPECTION_PATTERNS,
  type IntentDetection,
  isHedged,
  isNegatedAt,
  LEAK_PATTERNS,
  LEAK_SYMPTOM_PATTERNS,
  type MessageSignals,
  normalize,
  PARTIAL_SHINGLE_REPAIR,
  REPLACEMENT_PATTERNS,
  STORM_PATTERNS,
  wordCount,
} from "./intents";
import type {
  AdvisorAttachment,
  AdvisorContactMethod,
  AdvisorContext,
  AdvisorGoal,
  AssessmentField,
  RoofingAssessment,
} from "./types";

/*
 * Deterministic information extraction.
 *
 * Every message is scanned for everything useful, regardless of what was
 * asked, so one sentence can fill several fields. Short replies ("Bedroom.",
 * "Maybe 12 years.") are then read against the question the advisor just
 * asked. Each value carries a confidence so hedged answers aren't treated as
 * certain.
 */

export type FieldUpdate = {
  [K in AssessmentField]: {
    field: K;
    value: RoofingAssessment[K];
    confidence: number;
    /** Read as the answer to the advisor's last question. */
    contextual?: boolean;
  };
}[AssessmentField];

export interface MessageAnalysis {
  raw: string;
  text: string;
  intent: IntentDetection | null;
  signals: MessageSignals;
  updates: FieldUpdate[];
  /** Fields the homeowner says they don't know or won't share. */
  unknownFields: AssessmentField[];
  photoShared: boolean;
  estimateAccepted: boolean;
  estimateDeclined: boolean;
  contactDeclined: boolean;
  /** They tried to give a phone number that doesn't parse. */
  invalidPhone: boolean;
  /** The value picked when answering a "just to check" question. */
  confirmation: string | number | null;
  /** Whether the message responded to the advisor's last question at all. */
  answeredLastGoal: boolean;
}

export interface AnalysisInput {
  message: string;
  attachments: readonly AdvisorAttachment[];
  assessment: RoofingAssessment;
  context: AdvisorContext;
  now: Date;
}

function makeUpdate<K extends AssessmentField>(
  field: K,
  value: RoofingAssessment[K],
  confidence: number,
  contextual = false,
): FieldUpdate {
  return { field, value, confidence, contextual } as FieldUpdate;
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

const UNIT_WORDS: Readonly<Record<string, number>> = {
  zero: 0,
  a: 1,
  an: 1,
  one: 1,
  single: 1,
  two: 2,
  couple: 2,
  three: 3,
  few: 3,
  four: 4,
  five: 5,
  several: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TEN_WORDS: Readonly<Record<string, number>> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const NUMBER_WORD =
  "(?:(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)";
const QUANTITY = `(?:\\d{1,3}|a couple(?: of)?|a few|a dozen|several|couple|few|an?|${NUMBER_WORD})`;
const TIME_UNIT = "(?:days?|weeks?|months?|years?|hours?)";
const SOFT_HEDGE_LIST =
  "about|around|maybe|probably|roughly|approximately|approx\\.?|like|almost|nearly|close to|i think|i'd say|i guess|only|just";
/** Hedges that soften a number without changing it. */
const SOFT_HEDGES = `(?:${SOFT_HEDGE_LIST})`;
/** Also "over 20", "under 5": these change the number. */
const HEDGE_WORDS = `(?:${SOFT_HEDGE_LIST}|at least|over|under|more than|less than)`;

export function parseQuantity(token: string): number | null {
  const t = token.trim().replace(/\s+of$/, "");
  if (/^\d+(?:\.\d+)?$/.test(t)) return Number.parseFloat(t);
  if (t === "a couple" || t === "couple") return 2;
  if (t === "a few" || t === "few") return 3;
  if (t === "a dozen") return 12;
  let total = 0;
  for (const part of t.split(/[- ]/)) {
    const tens = TEN_WORDS[part];
    const units = UNIT_WORDS[part];
    if (tens !== undefined) total += tens;
    else if (units !== undefined) total += units;
    else return null;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

const DAY = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)";
const SEASON = "(?:spring|summer|fall|autumn|winter)";
const RELATIVE_TIME = [
  "(?:earlier |late |early )?(?:this morning|this afternoon|this evening|today|tonight|last night|yesterday(?: morning| afternoon| evening)?|the other day|the other night)",
  `(?:last|this past|earlier this|this)\\s+(?:week|month|year|weekend|${SEASON}|${DAY})`,
  `(?:over|during)\\s+the\\s+weekend`,
  `(?:${HEDGE_WORDS}\\s+)?${QUANTITY}\\s+${TIME_UNIT}\\s+ago`,
  "a (?:while|bit|long time)(?: ago| back)",
  "recently|just now|a while back",
  `(?:on\\s+)?${DAY}`,
].join("|");

const RELATIVE_TIME_RE = new RegExp(`\\b(?:${RELATIVE_TIME})\\b`, "g");
// "for a month" is a duration looking back; "in two weeks" looks forward, so it's left out.
const DURATION_RE = new RegExp(
  `\\bfor\\s+(?:about |around |almost |nearly |over |like |roughly |the (?:last|past) )?(${QUANTITY})\\s+(${TIME_UNIT})\\b|\\bthe (?:last|past) (${QUANTITY})\\s+(${TIME_UNIT})\\b`,
  "g",
);
const START_CUE =
  /\b(?:started|began|begun|noticed|noticing|first saw|saw it|showed up|appeared|popped up|leaking|leaked|dripping|since|happening|going on)\b[^.?!]{0,25}$/;
const UNRELATED_TIME_CUE =
  /\b(?:bought|moved|purchased|built|closed on|inspected|painted|installed|replaced)\b[^.?!]{0,20}$/;
const BARE_DURATION_RE = new RegExp(
  `^(?:(?:actually|sorry|oh|wait|no)[,.]?\\s+)?(?:it(?:'s| was| has been| started)\\s+)?(?:${HEDGE_WORDS}\\s+)?(${QUANTITY})\\s+(${TIME_UNIT})(?:\\s+ago)?\\b`,
);

const STORM_WORD =
  "(?:storms?|hail(?:storm)?|hurricane|tornado|wind ?storm|thunderstorm|bad weather|high winds?)";
const STORM_BEFORE_TIME = new RegExp(
  `\\b${STORM_WORD}\\b(?:\\s+(?:we had|that came through|that hit|hit(?: us)?|came through|rolled through|was|on|from|there))*\\s*$`,
);
const STORM_AFTER_TIME = new RegExp(
  `^(?:'s)?\\s+(?:big |bad |huge |massive |last )?${STORM_WORD}\\b`,
);
const AFTER_STORM_RE = new RegExp(
  `\\b(?:after|since|from|following|during)\\s+(?:the|that|a|this|last\\s+\\w+'s|yesterday's|\\w+'s)?\\s*(?:big |bad |huge |massive |recent )?${STORM_WORD}\\b`,
);
const INSTALL_BEFORE_TIME =
  /\b(?:installed|put (?:on|in)|replaced|redone|re-?roofed|new roof|got (?:a |the )?(?:new )?roof|was done|roof was (?:put on|done|installed))\b[^.?!]{0,20}$/;

interface TimeMatch {
  phrase: string;
  index: number;
  end: number;
}

function cleanTime(phrase: string): string {
  return phrase.replace(/^on\s+/, "").replace(/\s+/g, " ").trim();
}

function findTimes(text: string): TimeMatch[] {
  const matches: TimeMatch[] = [];
  for (const match of text.matchAll(RELATIVE_TIME_RE)) {
    const index = match.index ?? 0;
    matches.push({ phrase: cleanTime(match[0]), index, end: index + match[0].length });
  }
  for (const match of text.matchAll(DURATION_RE)) {
    const index = match.index ?? 0;
    const quantity = match[1] ?? match[3];
    const unit = match[2] ?? match[4];
    if (!quantity || !unit) continue;
    if (matches.some((m) => m.index <= index && m.end >= index)) continue;
    matches.push({
      phrase: `about ${quantity} ${unit} ago`,
      index,
      end: index + match[0].length,
    });
  }
  return matches
    .filter((m) => !/\bnot\s+$/.test(text.slice(Math.max(0, m.index - 5), m.index)))
    .sort((a, b) => a.index - b.index);
}

// ---------------------------------------------------------------------------
// Places in the house
// ---------------------------------------------------------------------------

const ROOM =
  "(?:master bed(?:room)?|guest bed(?:room)?|guest room|spare (?:bed)?room|kids'? (?:bed)?room|children's (?:bed)?room|nursery|bed ?room|living room|family room|dining room|great room|sitting room|front room|kitchen|master bath(?:room)?|bath ?room|powder room|restroom|attic|crawl ?space|hallway|hall|garage|basement|office|study|den|laundry(?: room)?|closet|stair(?:well|way|case|s)|entry(?:way)?|foyer|mud ?room|sun ?room|porch|loft|bonus room|play ?room|game room|media room|utility room)";
const ROOM_MODIFIER =
  "(?:upstairs|downstairs|back|front|main|second|third|master|guest|spare|small|big|large|little|middle|son's|daughter's|baby's|kid's|kids'|upper|lower|other)";
const FEATURE =
  "(?:chimney|skylights?|(?:roof |plumbing |exhaust |bathroom )?vents?|windows?|dormers?|flashing|valley|ridge|gutters?|eaves?|soffits?|fascia|exhaust fan|light fixtures?|ceiling fan|recessed lights?|can lights?)";
const SURFACE = "(?:ceilings?|walls?|floors?|drywall)";
const AREA =
  "(?:upstairs|downstairs|second floor|top floor|first floor|main floor|back of the house|front of the house)";

const ROOM_RE = new RegExp(`\\b(?:(${ROOM_MODIFIER})\\s+)?(${ROOM})\\b`, "g");
const FEATURE_RE = new RegExp(
  `\\b(around|near|by|at|from|under|next to|beside|through)\\s+(?:the |a |my |our )?(${FEATURE})\\b`,
);
const BARE_FEATURE_RE = new RegExp(`\\b(${FEATURE})\\b`);
const SURFACE_RE = new RegExp(`\\b(${SURFACE})\\b`);
const AREA_RE = new RegExp(`\\b(${AREA})\\b`);

export const ROOM_PATTERN = new RegExp(`\\b${ROOM}\\b`);
export const AREA_PATTERN = new RegExp(`\\b${AREA}\\b`);
export const FEATURE_PATTERN = new RegExp(`\\b${FEATURE}\\b`);
export const SURFACE_PATTERN = new RegExp(`\\b${SURFACE}\\b`);

function singular(word: string): string {
  return word.replace(/(ceiling|wall|floor|skylight|window|vent|gutter|dormer)s\b/, "$1");
}

/** A readable location like "bedroom ceiling" or "around the chimney". */
export function extractLocation(text: string): string | null {
  let room: string | null = null;
  for (const match of text.matchAll(ROOM_RE)) {
    const before = text.slice(Math.max(0, (match.index ?? 0) - 12), match.index ?? 0);
    // "a 3 bedroom house" describes the home, not where the water is.
    if (/(?:\d|two|three|four|five|six)[- ]?$/.test(before.trim())) continue;
    if (/^\s*(?:house|home)\b/.test(text.slice((match.index ?? 0) + match[0].length))) continue;
    const modifier = match[1];
    const name = (match[2] ?? "").replace(/\s+/g, " ").replace("bed room", "bedroom").replace("bath room", "bathroom");
    room = modifier && modifier !== "other" ? `${modifier} ${name}` : name;
    break;
  }

  const area = room ? null : (AREA_RE.exec(text)?.[1] ?? null);
  const surface = SURFACE_RE.exec(text)?.[1] ?? null;
  const featureMatch = FEATURE_RE.exec(text);
  const feature = featureMatch
    ? `${featureMatch[1] === "through" || featureMatch[1] === "from" ? "around" : featureMatch[1]} the ${singular(featureMatch[2] ?? "")}`
    : null;
  const bareFeature =
    !feature && !room && !surface ? (BARE_FEATURE_RE.exec(text)?.[1] ?? null) : null;

  const place = [area ?? room, surface ? singular(surface) : null]
    .filter(Boolean)
    .join(" ");
  const parts = [place || null, feature ?? (bareFeature ? singular(bareFeature) : null)].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

// ---------------------------------------------------------------------------
// Damage
// ---------------------------------------------------------------------------

const EXTENSIVE =
  /\b(?:half|most|majority|a lot|lots|large|big (?:section|area|chunk|patch)|whole|entire|all over|everywhere|multiple|several|many|a bunch|a ton|tons)\b/;

const MISSING_SHINGLES_PATTERNS = [
  /\b(?:missing|lost|gone)\s+(?:a\s+|some\s+|a few\s+|several\s+|\w+\s+)?shingles?\b/,
  /\bshingles?\b[^.?!]{0,40}\b(?:missing|gone|blown off|blew off|came off|coming off|torn off|ripped off|fell off|flew off|on the (?:lawn|ground|grass|driveway|yard|deck)|in the (?:yard|grass|gutters?|driveway))\b/,
  /\b(?:blew|blown|torn|ripped|came|fell)\s+off\b[^.?!]{0,15}\bshingles?\b/,
] as const;

const DAMAGED_SHINGLES_PATTERNS = [
  /\b(?:cracked|curling|curled|lifted|lifting|loose|broken|damaged|torn|creased|buckling|buckled|blistered|blistering|brittle|worn|bald|cupped|cupping)\s+(?:\w+\s+)?shingles?\b/,
  /\bshingles?\b[^.?!]{0,25}\b(?:cracked|curling|curled|lifted|lifting|loose|broken|damaged|torn|creased|buckling|buckled|blistered|brittle|worn|bald|cupping)\b/,
] as const;

interface DamageFacts {
  items: string[];
  missingShingles: boolean | null;
  damagedShingles: boolean | null;
  exposed: boolean | null;
  tarped: boolean;
  extensive: boolean;
  none: boolean;
}

function extractDamage(text: string): DamageFacts {
  const items: string[] = [];
  const extensive = EXTENSIVE.test(text);
  let missingShingles: boolean | null = null;
  let damagedShingles: boolean | null = null;
  let exposed: boolean | null = null;

  if (findAffirmed(text, MISSING_SHINGLES_PATTERNS)) {
    missingShingles = true;
    const single = /\b(?:a|one|1|single)\s+(?:missing\s+)?shingle\b(?!s)/.test(text);
    items.push(
      extensive ? "large area of missing shingles" : single ? "a missing shingle" : "missing shingles",
    );
  } else if (/\bshingles?\b[^.?!]{0,20}\b(?:look|looks|seem|seems)\s+(?:gone|missing)\b/.test(text)) {
    missingShingles = true;
    items.push(extensive ? "large area of missing shingles" : "missing shingles");
  }

  if (findAffirmed(text, DAMAGED_SHINGLES_PATTERNS)) {
    damagedShingles = true;
    items.push("damaged shingles");
  }
  if (/\bgranules?\b/.test(text)) items.push("granule loss");
  if (/\bflashing\b/.test(text) && /\b(?:loose|bent|damaged|missing|rusted|rusty|pulled|lifted|lifting|torn|cracked|gone)\b/.test(text)) {
    items.push("damaged flashing");
  }
  if (/\bgutters?\b[^.?!]{0,25}\b(?:damaged|dented|bent|falling|hanging|pulled|ripped|sagging|torn|gone)\b/.test(text)) {
    items.push("damaged gutters");
  }
  if (/\b(?:dents?|dented|dings?|dimpl\w*)\b/.test(text)) items.push("dents");
  if (/\b(?:cracked|broken)\s+tiles?\b|\btiles?\b[^.?!]{0,15}\b(?:cracked|broken|slipped|missing)\b/.test(text)) {
    items.push("cracked tiles");
  }
  if (/\broof(?:line)?\b[^.?!]{0,15}\b(?:sag|sags|sagging|dip|dips|dipping|bowing)\b/.test(text)) {
    items.push("sagging roofline");
  }
  if (/\b(?:moss|algae|lichen)\b/.test(text)) items.push("moss or algae");
  if (/\btree\b|\b(?:branch|limb)(?:es|s)?\b/.test(text) && /\b(?:roof|house|fell|came down|hit|landed|on)\b/.test(text)) {
    items.push("tree or limb damage");
  }

  const tarped = /\btarp(?:ped|s)?\b/.test(text);
  if (
    /\bholes? in (?:the|my|our) roof\b|\bcan see (?:the )?(?:sky|daylight|sunlight|light)\b|\bopen to the (?:sky|elements|weather)\b|\b(?:bare|exposed) (?:wood|decking|deck|plywood|boards|underlayment)\b|\bexposed\b|\b(?:part of|section of|chunk of|piece of)\s+(?:the |my |our )?roof\b[^.?!]{0,20}\b(?:gone|missing|blew off|blown off|torn off|ripped off|came off)\b/.test(text) ||
    tarped
  ) {
    exposed = !/\bnot exposed\b|\bno (?:holes|bare wood)\b/.test(text);
    if (exposed) items.push(tarped ? "opening covered with a tarp" : "exposed roof deck or opening");
  }

  const none =
    items.length === 0 &&
    /\b(?:nothing (?:visible|that i can see|i can see|obvious)|can't see anything|cant see anything|looks? (?:fine|ok(?:ay)?|good|normal|alright)|no (?:visible )?damage|doesn't look damaged|nothing obvious|not that i can see)\b/.test(text);

  return {
    items: [...new Set(items)],
    missingShingles,
    damagedShingles,
    exposed,
    tarped,
    extensive,
    none,
  };
}

const INTERIOR_PATTERNS = [
  /\bstain(?:s|ed|ing)?\b/,
  /\b(?:water|dark|brown|yellow|wet)\s+(?:spots?|marks?|rings?|patches?)\b/,
  /\bdiscolou?r(?:ed|ation|ing)\b/,
  /\bbubbl(?:e|es|ing|ed)\b/,
  /\bpeeling paint\b/,
  /\bsoft spots?\b/,
  /\b(?:sagging|bulging|bowing)\s+(?:ceiling|drywall)\b|\bceiling\b[^.?!]{0,15}\b(?:sagging|bulging|bowing)\b/,
  /\bmou?ld(?:y)?\b|\bmildew\b/,
  /\bwet\s+(?:carpet|insulation|drywall|floor|ceiling|walls?)\b/,
  /\bwater damage\b/,
  /\bdamaged\s+(?:ceiling|drywall|floor|walls?|carpet|insulation)\b/,
] as const;

function extractInteriorDamage(text: string): string | null {
  const match = findAffirmed(text, INTERIOR_PATTERNS);
  if (!match) return null;
  const surface = SURFACE_RE.exec(text)?.[1];
  const phrase = match[0].replace(/\s+/g, " ");
  return surface && !phrase.includes(surface) ? `${phrase} on the ${singular(surface)}` : phrase;
}

// ---------------------------------------------------------------------------
// The roof itself
// ---------------------------------------------------------------------------

function hedgeBefore(text: string, index: number): boolean {
  return new RegExp(`${HEDGE_WORDS}\\s*$`).test(text.slice(Math.max(0, index - 22), index)) || isHedged(text);
}

function ageConfidence(text: string, index: number, base = 0.9): number {
  return hedgeBefore(text, index) ? Math.min(base, 0.7) : base;
}

interface NumberFact {
  value: number;
  confidence: number;
}

/** Parses "under 5", "5 - 10", "over 20", "about 12" into one number. */
function parseApproximateNumber(phrase: string): NumberFact | null {
  const range = new RegExp(`(${QUANTITY})\\s*(?:-|to|and)\\s*(${QUANTITY})`).exec(phrase);
  if (range) {
    const low = parseQuantity(range[1] ?? "");
    const high = parseQuantity(range[2] ?? "");
    if (low !== null && high !== null && high > low) {
      return { value: Math.floor((low + high) / 2), confidence: 0.6 };
    }
  }
  const single = new RegExp(`(under|less than|below|over|more than|above|at least)?\\s*(${QUANTITY})(\\s*\\+)?`).exec(phrase);
  if (!single) return null;
  const value = parseQuantity(single[2] ?? "");
  if (value === null) return null;
  const qualifier = single[1];
  if (qualifier === "under" || qualifier === "less than" || qualifier === "below") {
    return { value: Math.max(1, value - 2), confidence: 0.55 };
  }
  if (qualifier || single[3]) return { value: value + 2, confidence: 0.55 };
  return { value, confidence: isHedged(phrase) ? 0.65 : 0.9 };
}

function extractRoofAge(text: string, now: Date, expectsAge: boolean): NumberFact | null {
  const year = now.getUTCFullYear();

  const rangeOld = new RegExp(`\\b(\\d{1,2})\\s*(?:-|to)\\s*(\\d{1,2})\\s*(?:years?|yrs?)(?:\\s*-\\s*|\\s+)old\\b`).exec(text);
  if (rangeOld) {
    const low = Number(rangeOld[1]);
    const high = Number(rangeOld[2]);
    if (high > low) return { value: Math.floor((low + high) / 2), confidence: 0.6 };
  }

  const old = new RegExp(
    `\\b(${HEDGE_WORDS}\\s+)?(\\d{1,2}|${NUMBER_WORD}|a couple(?: of)?|a few|a dozen|several)(\\s*\\+)?\\s*(?:-\\s*)?(?:years?|yrs?)(?:\\s*-\\s*|\\s+)old\\b`,
  ).exec(text);
  if (old && !/\b(?:house|home|kid|son|daughter|baby|dog|cat|furnace|water heater)\b/.test(text.slice(old.index + old[0].length, old.index + old[0].length + 12))) {
    const value = parseQuantity(old[2] ?? "");
    if (value !== null) {
      const qualifier = old[1]?.trim();
      if (qualifier && /^(?:over|more than|at least)$/.test(qualifier)) return { value: value + 2, confidence: 0.55 };
      if (qualifier && /^(?:under|less than)$/.test(qualifier)) return { value: Math.max(1, value - 2), confidence: 0.55 };
      return { value, confidence: ageConfidence(text, old.index + (old[1]?.length ?? 0)) };
    }
  }

  const installedYear = /\b(?:installed|put (?:on|in)|replaced|redone|re-?roofed|new roof|got (?:a |the )?(?:new )?roof|was done|roof (?:is )?from|done)\b[^.?!]{0,15}?\b((?:19|20)\d{2})\b/.exec(text) ??
    /\b((?:19|20)\d{2})\s+roof\b/.exec(text);
  if (installedYear) {
    const age = year - Number(installedYear[1]);
    if (age >= 0 && age <= 80) return { value: age, confidence: 0.9 };
  }

  const installedAgo = new RegExp(
    `\\b(?:installed|put (?:on|in)|replaced|redone|re-?roofed|new roof|got (?:a |the )?(?:new )?roof|was done|roof was (?:put on|done|installed))\\b[^.?!]{0,15}?\\b(?:${HEDGE_WORDS}\\s+)?(${QUANTITY})\\s+(?:years?|yrs?)\\s+ago\\b`,
  ).exec(text);
  if (installedAgo) {
    const value = parseQuantity(installedAgo[1] ?? "");
    if (value !== null) return { value, confidence: ageConfidence(text, installedAgo.index) };
  }

  const hadFor = new RegExp(`\\bhad (?:the|this|our|my|that) roof (?:for )?(${QUANTITY})\\s+(?:years?|yrs?)\\b`).exec(text);
  if (hadFor) {
    const value = parseQuantity(hadFor[1] ?? "");
    if (value !== null) return { value, confidence: 0.7 };
  }

  const builtIn = /\b(?:house|home)\b[^.?!]{0,20}\bbuilt\s+(?:in\s+)?((?:19|20)\d{2})\b/.exec(text);
  if (builtIn && /\boriginal\b/.test(text)) {
    const age = year - Number(builtIn[1]);
    if (age >= 0 && age <= 80) return { value: age, confidence: 0.6 };
  }

  const decades = /\b(a|one|two|three|\d)\s+decades?\b/.exec(text);
  if (decades && /\b(?:roof|old)\b/.test(text)) {
    const value = parseQuantity(decades[1] ?? "");
    if (value !== null) return { value: value * 10, confidence: 0.6 };
  }

  if (/\bbrand new\b/.test(text) && (expectsAge || /\broof\b/.test(text))) {
    return { value: 1, confidence: 0.6 };
  }

  const subject = new RegExp(
    `\\b(?:roof|shingles?)(?:\\s+is|\\s+are|'s|\\s+was)?\\s+(?:${HEDGE_WORDS}\\s+)?(\\d{1,2}|${NUMBER_WORD})\\b(?!\\s*(?:sq|square|feet|ft|%|stor|floor|bed|bath|minute|hour|day|week|month|squares|ago|k\\b|,\\d))`,
  ).exec(text);
  if (subject) {
    const value = parseQuantity(subject[1] ?? "");
    if (value !== null && value <= 80) return { value, confidence: ageConfidence(text, subject.index, 0.85) };
  }

  if (expectsAge) {
    const bare = new RegExp(
      `^(?:(?:actually|sorry|oh|wait|no|hmm)[,.]?\\s+)?(?:it(?:'s| is| was)\\s+|i'd say\\s+|i think\\s+|i guess\\s+)?(?:${SOFT_HEDGES}\\s+)?((?:under|less than|over|more than|at least)?\\s*${QUANTITY}(?:\\s*(?:-|to)\\s*${QUANTITY})?(?:\\s*\\+)?)\\s*(?:years?|yrs?)?(?:\\s+old)?(?:\\s+(?:or so|ish|give or take))?[.!?]*$`,
    ).exec(text);
    if (bare) {
      const parsed = parseApproximateNumber(bare[1] ?? "");
      if (parsed && parsed.value <= 80) {
        return { value: parsed.value, confidence: isHedged(text) ? Math.min(parsed.confidence, 0.65) : parsed.confidence };
      }
    }
  }
  return null;
}

const MATERIAL_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["metal", /\b(?:metal|steel|aluminum|tin|standing[- ]seam|corrugated)\b/],
  ["slate", /\bslate\b/],
  ["tile", /\b(?:clay|terra ?cotta|concrete tiles?|spanish tiles?|barrel tiles?|tile roof|roof tiles?)\b|^tiles?[.!]*$|\bit's tile\b/],
  ["flat / low slope", /\b(?:flat roof|low[- ]slope|tpo|epdm|rubber roof|membrane|modified bitumen|built[- ]up|tar and gravel|torch[- ]down)\b|\broof is flat\b|^flat(?: roof)?[.!]*$/],
  ["wood shake", /\b(?:wood shakes?|cedar shakes?|shakes|cedar)\b/],
  ["asphalt shingles", /\b(?:asphalt|architectural|3[- ]tab|three[- ]tab|composition|comp shingles?|dimensional)\b|\b(?:regular|normal|standard|typical|just)\s+shingles?\b|^(?:asphalt\s+)?shingles?[.!]*$|\bshingle roof\b/],
];

interface MaterialFact {
  material: string;
  confidence: number;
}

function extractMaterial(text: string, expectsMaterial: boolean): MaterialFact | null {
  for (const [material, pattern] of MATERIAL_PATTERNS) {
    const match = pattern.exec(text);
    if (match && !isNegatedAt(text, match.index)) {
      return { material, confidence: isHedged(text) ? 0.7 : 0.9 };
    }
  }
  if (expectsMaterial && /\bshingles?\b/.test(text)) {
    return { material: "asphalt shingles", confidence: 0.8 };
  }
  if (expectsMaterial && /\btiles?\b/.test(text)) {
    return { material: "tile", confidence: 0.8 };
  }
  return null;
}

const SQFT_RE =
  /\b((?:under|less than|below|over|more than|above|about|around|roughly|approximately|maybe|almost|nearly)\s+)?(\d{1,2},\d{3}|\d{3,5}|\d{1,2}(?:\.\d)?\s*k)(?:\s*(?:-|to)\s*(\d{1,2},\d{3}|\d{3,5}|\d{1,2}(?:\.\d)?\s*k))?\s*(?:\+\s*)?(?:sq\.?\s*(?:ft|feet|foot)\.?|square\s*(?:feet|foot|ft)|sqft|sf)(?=$|[^a-z])/;

function formatSquareFeet(token: string): string {
  const numeric = token.includes("k")
    ? Math.round(Number.parseFloat(token) * 1000)
    : Number(token.replace(/,/g, ""));
  return numeric.toLocaleString("en-US");
}

interface SizeFact {
  field: "home_size" | "roof_size";
  value: string;
  confidence: number;
}

function extractSize(text: string, expectsSize: boolean): SizeFact | null {
  const squares = /\b(\d{1,3})\s+squares\b/.exec(text);
  if (squares) {
    const count = Number(squares[1]);
    return {
      field: "roof_size",
      value: `${(count * 100).toLocaleString("en-US")} sq ft (${count} squares)`,
      confidence: 0.9,
    };
  }

  const sqft = SQFT_RE.exec(text);
  if (sqft) {
    const qualifier = sqft[1]?.trim();
    const low = formatSquareFeet(sqft[2] ?? "0");
    const high = sqft[3] ? formatSquareFeet(sqft[3]) : null;
    const value = `${qualifier ? `${qualifier} ` : ""}${low}${high ? `–${high}` : ""} sq ft`;
    const window = text.slice(Math.max(0, sqft.index - 30), sqft.index + sqft[0].length + 20);
    const field = /\broof\b/.test(window) && !/\b(?:house|home)\b/.test(window) ? "roof_size" : "home_size";
    return { field, value, confidence: qualifier || high ? 0.7 : isHedged(text) ? 0.75 : 0.9 };
  }

  if (expectsSize) {
    const bare = /^(?:(?:about|around|roughly|approximately|maybe|like|i think|probably)\s+)?(\d{1,2},\d{3}|\d{3,5}|\d{1,2}(?:\.\d)?\s*k)\b/.exec(text);
    if (bare) {
      const numeric = Number(formatSquareFeet(bare[1] ?? "0").replace(/,/g, ""));
      if (numeric >= 300 && numeric <= 20000) {
        return { field: "home_size", value: `${formatSquareFeet(bare[1] ?? "0")} sq ft`, confidence: 0.75 };
      }
    }
  }

  const bedrooms = /\b(\d|two|three|four|five|six)[- ](?:bed(?:room)?|br)\b/.exec(text);
  if (bedrooms && (expectsSize || /\b(?:house|home)\b/.test(text))) {
    const count = parseQuantity(bedrooms[1] ?? "");
    if (count !== null) return { field: "home_size", value: `${count}-bedroom home`, confidence: 0.4 };
  }
  return null;
}

function extractStories(text: string, expectsStories: boolean): NumberFact | null {
  const explicit = /\b(one|single|1|two|2|three|3|four|4)[- ]?(?:stor(?:y|ey|ies|eys)|levels?|floors?)\b/.exec(text);
  if (explicit && !/\b(?:ceiling|floor|room)s?\s+on\b/.test(text.slice(0, explicit.index))) {
    const value = parseQuantity(explicit[1] === "single" ? "one" : (explicit[1] ?? ""));
    if (value !== null && value >= 1 && value <= 4) return { value, confidence: 0.9 };
  }
  if (/\bsplit[- ]level\b/.test(text)) return { value: 2, confidence: 0.6 };
  if (/\b(?:ranch|rambler|bungalow|single[- ]level)\b/.test(text)) return { value: 1, confidence: 0.8 };
  if (expectsStories) {
    const bare = /^(?:it's\s+|just\s+|only\s+)?(one|two|three|four|1|2|3|4)(?:\s+or more)?\b/.exec(text);
    if (bare) {
      const value = parseQuantity(bare[1] ?? "");
      if (value !== null) return { value, confidence: 0.85 };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Contact details
// ---------------------------------------------------------------------------

const PHONE_RE = /(?:\+?1[\s.-]?)?\(?([2-9]\d{2})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\b/;
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const STREET_SUFFIX =
  "(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|way|pl|place|ter|terrace|cir|circle|pkwy|parkway|hwy|highway|trl|trail|loop|sq|square|row|run|pike|path|pt|point|xing|crossing)";
const STREET_RE = new RegExp(
  `\\b(\\d{1,6}[a-z]?\\s+(?:[nsew]\\.?\\s+|north\\s+|south\\s+|east\\s+|west\\s+)?[a-z0-9][a-z0-9.'-]*(?:\\s+[a-z0-9][a-z0-9.'-]*){0,4}?\\s+${STREET_SUFFIX})\\b\\.?`,
  "i",
);
const CITY_STATE_ZIP_RE =
  /,\s*([a-z][a-z .'-]{1,40}?),?\s+([a-z]{2})\.?(?:\s+(\d{5})(?:-\d{4})?)?\s*$/i;
const ZIP_RE = /\b(\d{5})(?:-\d{4})?\b/;
const US_STATES = new Set(
  "al ak az ar ca co ct de fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy dc".split(" "),
);

export function normalizePhone(raw: string): string | null {
  const match = PHONE_RE.exec(raw);
  if (!match) return null;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

export function isValidEmail(raw: string): boolean {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw.trim());
}

const NOT_NAME_WORDS = new Set(
  (
    "yes yeah yep no nope not sure okay ok hi hello hey thanks thank you sorry " +
    "the a an my our it its this that there here roof leak leaking water storm " +
    "worried looking thinking good done fine in at on so getting seeing noticing pretty just really " +
    "trying hoping interested calling wondering concerned afraid glad happy home house " +
    "homeowner owner renting renter still going gonna having wanting asking curious " +
    "about around maybe probably call text email phone number address back later tomorrow " +
    "today tonight asap anytime whenever please now soon morning afternoon evening weekend " +
    "shingle shingles gutter gutters damage damaged photo picture skip none nothing"
  ).split(" "),
);

/** Whether a phrase describes the house rather than naming a person. */
function isHouseVocabulary(text: string): boolean {
  const lower = text.toLowerCase();
  return ROOM_PATTERN.test(lower) || AREA_PATTERN.test(lower) || FEATURE_PATTERN.test(lower) || SURFACE_PATTERN.test(lower);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part) =>
      part
        .split(/([-'’])/)
        .map((piece) => (piece.length > 1 || /[a-z]/i.test(piece) ? piece.charAt(0).toUpperCase() + piece.slice(1).toLowerCase() : piece))
        .join(""),
    )
    .join(" ");
}

function looksLikeName(candidate: string): boolean {
  const words = candidate.trim().split(/\s+/);
  if (words.length === 0 || words.length > 4) return false;
  if (isHouseVocabulary(candidate)) return false;
  return words.every(
    (word) => /^[a-z][a-z'’-]{0,29}$/i.test(word) && !NOT_NAME_WORDS.has(word.toLowerCase()),
  );
}

function extractName(raw: string, expectsName: boolean): string | null {
  const intro = /\b(my name is|my name's|name's|name is|call me|i'm|i am|this is|it's)\s+([a-z][a-z'’-]+(?:\s+[a-z][a-z'’-]+){0,2})/i.exec(raw);
  if (intro) {
    const lead = (intro[1] ?? "").toLowerCase();
    const candidate = (intro[2] ?? "").replace(/\s+(?:and|but|or|at|from|here|my|our|the|with|back|later|on|in)\b.*$/i, "");
    const direct = /name/.test(lead);
    // "I'm Dave" and "call me Dave" introduce someone; "call me back" doesn't.
    const properNoun =
      /^(?:i'm|i am|call me)$/.test(lead) && candidate.split(/\s+/).every((word) => /^[A-Z]/.test(word));
    if (looksLikeName(candidate) && (direct || properNoun || expectsName)) {
      return titleCase(candidate);
    }
  }
  if (expectsName) {
    const stripped = raw
      .replace(PHONE_RE, " ")
      .replace(EMAIL_RE, " ")
      .replace(/[,.;:!]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (stripped && looksLikeName(stripped)) return titleCase(stripped);
  }
  return null;
}

interface AddressFacts {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

function extractAddress(raw: string, expectsAddress: boolean): AddressFacts {
  const facts: AddressFacts = { address: null, city: null, state: null, zip: null };
  const street = STREET_RE.exec(raw);
  if (street) facts.address = titleCase(street[1] ?? "").replace(/\b([NSEW])\b\.?/g, "$1");

  const tail = street ? raw.slice(street.index + street[0].length) : raw;
  const cityStateZip = CITY_STATE_ZIP_RE.exec(tail.replace(/[.!]+$/, ""));
  if (cityStateZip && US_STATES.has((cityStateZip[2] ?? "").toLowerCase())) {
    facts.city = titleCase(cityStateZip[1] ?? "");
    facts.state = (cityStateZip[2] ?? "").toUpperCase();
    facts.zip = cityStateZip[3] ?? null;
  }
  if (!facts.zip && (street || expectsAddress || /\bzip\b/i.test(raw))) {
    facts.zip = ZIP_RE.exec(raw.replace(PHONE_RE, " "))?.[1] ?? null;
  }
  if (!facts.address && expectsAddress) {
    const leftover = raw
      .replace(PHONE_RE, " ")
      .replace(EMAIL_RE, " ")
      .replace(/^(?:it's|its|the address is|address is|we're at|we are at|i'm at|i am at)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!]+$/, "");
    const onlyZip = facts.zip !== null && leftover.replace(/\D/g, "") === facts.zip;
    if (leftover && !onlyZip && /\d/.test(leftover) && leftover.length <= 120) {
      facts.address = leftover;
    }
  }
  return facts;
}

function extractContactMethod(text: string, expectsPreference: boolean): AdvisorContactMethod | null {
  const text_ = /\b(?:text(?:ing)?|sms|message me)\b/.test(text);
  const call = /\b(?:call(?:ing)?|phone call|ring me)\b/.test(text);
  const email = /\be-?mail\b/.test(text);
  const explicit = /\b(?:text|call|email|e-mail)\s+(?:me|is (?:best|fine|good|better|great))\b|\b(?:prefer|rather|best)\b/.test(text);
  if (!expectsPreference && !explicit) return null;
  if (email && !text_ && !call) return "email";
  if (text_ && !call) return "text";
  if (call && !text_) return "phone";
  return null;
}

const TIME_OF_DAY_RE =
  /\b(?:mornings?|afternoons?|evenings?|weekends?|weekdays?|any ?time|after (?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|work|lunch|noon)|before (?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|noon|work)|lunch ?time|noon)\b/g;

function extractPreferredTime(text: string): string | null {
  const matches = [...text.matchAll(TIME_OF_DAY_RE)].map((match) => match[0]);
  return matches.length > 0 ? [...new Set(matches)].join(", ") : null;
}

// ---------------------------------------------------------------------------
// Answers read against the advisor's last question
// ---------------------------------------------------------------------------

/** Which way to reach them "determine_phone" asks for: a phone number, unless they'd rather email. */
export function contactTarget(assessment: RoofingAssessment): "phone" | "email" {
  return !assessment.phone && assessment.preferred_contact_method === "email" ? "email" : "phone";
}

/** Which detail "determine_contact_preference" asks for. */
export function preferenceTarget(assessment: RoofingAssessment): "preferred_time" | "preferred_contact_method" {
  return assessment.intent === "inspection" && !assessment.preferred_time
    ? "preferred_time"
    : "preferred_contact_method";
}

/** The fields each goal is trying to fill. */
export function goalFields(goal: AdvisorGoal | null, assessment: RoofingAssessment): AssessmentField[] {
  switch (goal) {
    case "identify_issue":
      return ["intent"];
    case "determine_urgency":
      return ["urgency"];
    case "locate_leak":
      return ["leak_location"];
    case "determine_active_leak":
      return ["active_leak"];
    case "determine_start_time":
      return assessment.intent === "storm_damage" ? ["storm_date", "issue_started"] : ["issue_started"];
    case "determine_storm_damage":
      return ["storm_damage"];
    case "determine_visible_damage":
      return ["visible_damage"];
    case "determine_exposed_roof":
      return ["exposed_roof"];
    case "determine_interior_damage":
      return ["interior_damage"];
    case "determine_replacement_reason":
      return ["current_condition"];
    case "determine_repair_scope":
      return ["issue_description"];
    case "determine_inspection_reason":
      return ["current_condition"];
    case "request_photo":
      return ["photos_available", "photos_uploaded"];
    case "determine_roof_age":
      return ["roof_age"];
    case "determine_roof_material":
      return ["roof_material"];
    case "determine_roof_size":
      return ["home_size", "roof_size"];
    case "determine_stories":
      return ["stories"];
    case "determine_replacement_interest":
      return ["replacement_interest"];
    case "determine_contact":
      return ["name"];
    case "determine_phone":
      return [contactTarget(assessment)];
    case "determine_address":
      return ["address", "zip_code"];
    case "determine_contact_preference":
      return [preferenceTarget(assessment)];
    default:
      return [];
  }
}

function cleanFreeText(raw: string, max = 200): string {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

/** Prefix for an interior description derived from where the water shows up. */
export const DERIVED_INTERIOR_PREFIX = "water coming through the ";

const REPAIR_WANTED =
  /\b(?:need|needs|want|wants|looking for|get|getting|like|hoping for)\s+(?:a |an |some |it |the roof |this |that )?(?:quick |small |simple )?(?:repair(?:ed|s)?|fix(?:ed)?|patch(?:ed)?)\b|\b(?:repair|fix|patch)\s+(?:it|the|my|our|this|that)\b/;

const UNKNOWN_TOPICS: ReadonlyArray<readonly [RegExp, readonly AssessmentField[]]> = [
  [/\bhow old\b|\broof'?s age\b|\bage of (?:the|my) roof\b/, ["roof_age"]],
  [/\bhow big\b|\bsquare (?:feet|footage)\b|\bsq\.? ?ft\b/, ["home_size", "roof_size"]],
  [/\bwhat (?:kind|type) of roof\b|\bwhat (?:it's|the roof is) made of\b|\bmaterial\b/, ["roof_material"]],
  [/\bhow many stor(?:y|ies)\b/, ["stories"]],
  [/\bwhen (?:it|this|the leak) (?:started|began)\b/, ["issue_started"]],
];

const PROBLEM_CONTEXT = [
  ...LEAK_PATTERNS,
  ...LEAK_SYMPTOM_PATTERNS,
  ...STORM_PATTERNS,
  /\bshingles?\b/,
  /\bdamage[ds]?\b/,
  /\bnoticed\b/,
  /\bstarted\b/,
];

export function analyzeMessage(input: AnalysisInput): MessageAnalysis {
  const { assessment, context, now } = input;
  const raw = input.message.trim();
  const text = normalize(raw);
  const lastGoal = context.last_goal;
  const signals = detectSignals(text);
  const photoShared = input.attachments.some((attachment) => attachment.kind === "photo");

  const updates: FieldUpdate[] = [];
  const unknownFields: AssessmentField[] = [];
  const set = <K extends AssessmentField>(
    field: K,
    value: RoofingAssessment[K],
    confidence: number,
    contextual = false,
  ) => {
    const existing = updates.findIndex((update) => update.field === field);
    const next = makeUpdate(field, value, confidence, contextual);
    if (existing >= 0) updates[existing] = next;
    else updates.push(next);
  };
  const has = (field: AssessmentField) => updates.some((update) => update.field === field);

  // A pending "no thanks" to an offer is a decline, not a request to stop.
  const offerPending =
    lastGoal === "offer_estimate" ||
    lastGoal === "request_photo" ||
    lastGoal === "determine_contact_preference";
  if (offerPending && signals.decline) signals.stop = false;
  if (lastGoal === "determine_contact_preference") {
    signals.humanRequest = false;
    signals.callbackRequest = false;
  }

  const intent = text ? detectIntent(text) : null;
  const correctionOf = signals.correction ? context.recent_fields : [];

  // --- The problem ---------------------------------------------------------
  const leakMentioned = findAffirmed(text, LEAK_PATTERNS) !== null;
  const symptomMentioned = findAffirmed(text, LEAK_SYMPTOM_PATTERNS) !== null;
  const leakContext = leakMentioned || symptomMentioned || /\bwater\b/.test(text);
  const problemContext = PROBLEM_CONTEXT.some((pattern) => pattern.test(text));

  if (intent && intent.value !== "unknown" && !assessment.issue_description && !signals.question) {
    set("issue_description", cleanFreeText(raw), 0.9);
  }

  // Active leak and how often.
  const frequency =
    /\b(?:whenever|every time|each time|only when|only if|when(?:ever)?)\s+it\s+(?:rains|storms|pours|snows|melts)\b/.exec(text) ??
    /\b(?:during|in|after)\s+(?:heavy|hard|big|any)\s+(?:rain|rains|storms?|downpours?)\b/.exec(text) ??
    /\bwhen it rains hard\b/.exec(text);
  if (frequency && (leakContext || lastGoal === "determine_active_leak" || assessment.intent === "leak")) {
    set("leak_frequency", frequency[0].replace(/^when it/, "whenever it"), 0.9);
    set("active_leak", true, 0.9);
  }
  if (leakContext && !has("active_leak")) {
    const now = /\b(?:right now|as we speak|currently|at the moment|still (?:leaking|dripping|coming in)|actively)\b/.exec(text);
    if (now && !isNegatedAt(text, now.index) && !/\bnot (?:right now|currently|at the moment)\b/.test(text)) {
      set("active_leak", true, 0.95);
    } else if (/\b(?:stopped|not anymore|no longer|dried up|has been fixed|got fixed|was fixed|isn't leaking anymore)\b/.test(text)) {
      set("active_leak", false, 0.85);
    } else if (
      /\b(?:is|are|'s|keeps?|keep)\s+(?:actively\s+|still\s+)?(?:leaking|dripping|coming (?:in|through)|pouring|getting in|seeping)\b/.test(text) ||
      /\b(?:water|rain)\b[^.?!]{0,20}\b(?:is|'s)\s+(?:coming|leaking|dripping|pouring|getting)\b/.test(text) ||
      /\bthere's water (?:coming|dripping|leaking|getting)\b/.test(text) ||
      /\bwater (?:dripping|leaking|coming|pouring)\b/.test(text)
    ) {
      set("active_leak", true, 0.7);
    } else if (/\bbeen (?:leaking|dripping)\b/.test(text)) {
      set("active_leak", true, 0.75);
    }
  }

  // Where the water shows up. "Actually, it's the guest bedroom." corrects it.
  const bareRoom = wordCount(text) <= 6 && (ROOM_PATTERN.test(text) || AREA_PATTERN.test(text));
  if (
    leakContext ||
    lastGoal === "locate_leak" ||
    (assessment.intent === "leak" &&
      (signals.correction || bareRoom || /\b(?:in|on|near|around|it's|its) the\b/.test(text)))
  ) {
    const location = extractLocation(text);
    if (location) set("leak_location", location, 0.9, lastGoal === "locate_leak");
  }

  // Interior damage.
  const interior = extractInteriorDamage(text);
  if (interior) {
    set("interior_damage", true, 0.85);
    set("interior_damage_description", interior, 0.8);
  } else if (/\b(?:nothing|no damage|no water|no leaks?|no stains?)\s+(?:inside|in the house|indoors)\b/.test(text)) {
    set("interior_damage", false, 0.8);
  } else if (leakMentioned && has("leak_location")) {
    const location = updates.find((update) => update.field === "leak_location")?.value;
    if (typeof location === "string" && (SURFACE_PATTERN.test(location) || ROOM_PATTERN.test(location))) {
      set("interior_damage", true, 0.75);
      set("interior_damage_description", `${DERIVED_INTERIOR_PREFIX}${location}`, 0.7);
    }
  }

  // Storms, and when things happened.
  const stormMention = findAffirmed(text, STORM_PATTERNS);
  const stormDenied =
    !stormMention &&
    /\b(?:no|not|wasn't|weren't|haven't|hasn't|didn't have)\b[^.?!]{0,15}\b(?:storms?|hail|bad weather|wind)\b/.test(text);
  if (stormMention) set("storm_damage", true, isHedged(text) ? 0.75 : 0.9);
  else if (stormDenied) set("storm_damage", false, 0.85);

  const times = findTimes(text).filter((time) => {
    const before = text.slice(Math.max(0, time.index - 40), time.index);
    return !INSTALL_BEFORE_TIME.test(before) && !UNRELATED_TIME_CUE.test(before);
  });
  let stormDate: string | null = null;
  let started: string | null = null;
  let startedFromCue = false;
  for (const time of times) {
    const before = text.slice(Math.max(0, time.index - 45), time.index);
    const after = text.slice(time.end);
    if (stormMention && (STORM_BEFORE_TIME.test(before) || STORM_AFTER_TIME.test(after))) {
      stormDate ??= time.phrase;
    } else if (START_CUE.test(before) && !startedFromCue) {
      started = time.phrase;
      startedFromCue = true;
    } else if (!started) {
      started = time.phrase;
    }
  }

  const afterStorm = AFTER_STORM_RE.exec(text);
  if (afterStorm && !isNegatedAt(text, afterStorm.index)) {
    set("storm_damage", true, 0.9);
    if (!started || (stormDate === null && afterStorm.index > text.indexOf(started))) {
      if (started && stormDate === null) stormDate = started;
      started = `after the storm${stormDate ? ` (${stormDate})` : ""}`;
    }
  }
  if (stormDate) set("storm_date", stormDate, isHedged(text) ? 0.7 : 0.85);

  const startGoal = lastGoal === "determine_start_time";
  const timeRelevant = problemContext || startGoal || correctionOf.includes("issue_started") || assessment.intent !== null;
  if (started && timeRelevant) {
    set("issue_started", started, isHedged(text) ? 0.7 : 0.85, startGoal);
  } else if (!started && (startGoal || correctionOf.includes("issue_started") || correctionOf.includes("storm_date"))) {
    const bare = BARE_DURATION_RE.exec(text);
    if (bare) {
      const phrase = `about ${bare[1]} ${bare[2]} ago`;
      const target = correctionOf.includes("storm_date") && !correctionOf.includes("issue_started") ? "storm_date" : "issue_started";
      set(target, phrase, isHedged(text) ? 0.7 : 0.85, true);
    }
  }
  if (!has("issue_started") && stormDate && (leakContext || problemContext) && !startGoal) {
    set("issue_started", `after the storm (${stormDate})`, 0.6);
  }
  if (startGoal && assessment.intent === "storm_damage" && has("issue_started") && !has("storm_date")) {
    const value = updates.find((update) => update.field === "issue_started")?.value;
    if (typeof value === "string") set("storm_date", value, 0.8, true);
  }

  // What's visible from outside.
  const damage = extractDamage(text);
  if (damage.items.length > 0) {
    set("visible_damage", damage.items, isHedged(text) ? 0.7 : 0.85);
  } else if (damage.none && (lastGoal === "determine_visible_damage" || /\b(?:outside|roof)\b/.test(text))) {
    set("visible_damage", [], 0.8, lastGoal === "determine_visible_damage");
  }
  if (damage.items.length === 0 && PARTIAL_SHINGLE_REPAIR.test(text)) {
    // "I need a few shingles replaced" says what's damaged.
    set("visible_damage", ["a few damaged or missing shingles"], 0.7);
  }
  if (damage.missingShingles !== null) set("missing_shingles", damage.missingShingles, isHedged(text) ? 0.7 : 0.85);
  if (damage.damagedShingles !== null) set("damaged_shingles", damage.damagedShingles, isHedged(text) ? 0.7 : 0.85);
  if (damage.exposed !== null) set("exposed_roof", damage.exposed, 0.85);
  if (damage.tarped) set("notes", "Opening is covered with a tarp.", 0.9);

  // --- The roof ------------------------------------------------------------
  const expectsAge =
    lastGoal === "determine_roof_age" ||
    context.pending_confirmation?.field === "roof_age" ||
    correctionOf.includes("roof_age");
  const age = extractRoofAge(text, now, expectsAge);
  if (age && age.value >= 0 && age.value <= 80) set("roof_age", age.value, age.confidence, expectsAge);

  const expectsMaterial = lastGoal === "determine_roof_material" || context.pending_confirmation?.field === "roof_material";
  const material = extractMaterial(text, expectsMaterial);
  if (material) {
    set("roof_material", material.material, material.confidence, expectsMaterial);
  } else if (/\bshingles?\b/.test(text) && !assessment.roof_material) {
    set("roof_material", "asphalt shingles", 0.55);
  }

  const expectsSize = lastGoal === "determine_roof_size" || context.pending_confirmation?.field === "home_size";
  const size = extractSize(text, expectsSize);
  if (size) set(size.field, size.value, size.confidence, expectsSize);

  const expectsStories = lastGoal === "determine_stories" || context.pending_confirmation?.field === "stories";
  const stories = extractStories(text, expectsStories);
  if (stories) set("stories", stories.value, stories.confidence, expectsStories);

  // --- What they want ------------------------------------------------------
  const partialRepair = PARTIAL_SHINGLE_REPAIR.test(text);
  if (!partialRepair && findAffirmed(text, REPLACEMENT_PATTERNS)) set("replacement_interest", true, 0.85);
  else if (/\b(?:don't|do not|doesn't)\s+(?:need|want)\s+(?:a\s+)?(?:new|full|whole)\s+roof\b|\bnot (?:a )?(?:full )?replacement\b/.test(text)) {
    set("replacement_interest", false, 0.85);
  }
  // "Constantly needs repairs" describes the roof; "I need a repair" is what they want.
  if (partialRepair || REPAIR_WANTED.test(text) || intent?.value === "repair") set("repair_interest", true, 0.8);
  if (findAffirmed(text, INSPECTION_PATTERNS)) set("inspection_interest", true, 0.85);
  if (signals.wantsVisit) set("inspection_interest", true, 0.75);

  // --- Contact details -----------------------------------------------------
  const target =
    lastGoal === "determine_contact" ? "name" : lastGoal === "determine_phone" ? contactTarget(assessment) : null;
  const phone = normalizePhone(raw);
  let invalidPhone = false;
  if (phone) {
    set("phone", phone, 0.95, target === "phone");
  } else if (target === "phone" && raw.replace(/\D/g, "").length >= 7) {
    invalidPhone = true;
  }
  const email = EMAIL_RE.exec(raw)?.[0];
  if (email) set("email", email.toLowerCase(), 0.95, target === "email");
  const name = extractName(raw, target === "name");
  const nameWelcome = target === "name" || !assessment.name || signals.correction;
  if (name && nameWelcome) set("name", name, target === "name" ? 0.9 : 0.8, target === "name");

  const expectsAddress = lastGoal === "determine_address";
  const address = extractAddress(raw, expectsAddress);
  if (address.address) set("address", address.address, expectsAddress ? 0.85 : 0.8, expectsAddress);
  if (address.city) set("city", address.city, 0.85);
  if (address.state) set("state", address.state, 0.85);
  if (address.zip) set("zip_code", address.zip, 0.9, expectsAddress);

  const expectsPreference = lastGoal === "determine_contact_preference";
  const method = extractContactMethod(text, expectsPreference);
  if (method) set("preferred_contact_method", method, 0.9, expectsPreference);
  const preferredTime = extractPreferredTime(text);
  if (preferredTime && expectsPreference && preferenceTarget(assessment) === "preferred_time" && wordCount(text) <= 6) {
    // "Weekday mornings" reads better whole than as "weekday, mornings".
    set("preferred_time", cleanFreeText(text.replace(/[.!]+$/, ""), 60), 0.85, true);
  } else if (preferredTime && (expectsPreference || /\b(?:best|prefer|works?|call|reach|visit|come)\b/.test(text))) {
    set("preferred_time", preferredTime, 0.85, expectsPreference);
  }

  // --- Urgency they state themselves ---------------------------------------
  if (signals.statedUrgency && (lastGoal === "determine_urgency" || signals.statedUrgency !== "normal")) {
    set("urgency", signals.statedUrgency, 0.8, lastGoal === "determine_urgency");
  }

  // --- Short answers to the last question ----------------------------------
  let estimateAccepted = false;
  let estimateDeclined = false;
  let contactDeclined = false;
  let confirmation: string | number | null = null;
  const yes = signals.affirmative;
  const no = signals.negative || (offerPending && signals.decline);
  const dontKnow = signals.dontKnow;
  const short = wordCount(text) <= 8 && !signals.question;
  // Free text is only taken as the answer when nothing else in the message explains it.
  const freeTextAnswer = short && text !== "" && !yes && !no && !signals.correction && updates.length === 0;

  switch (lastGoal) {
    case "identify_issue":
      break;
    case "locate_leak":
      if (!has("leak_location")) {
        if (dontKnow) unknownFields.push("leak_location");
        else if (freeTextAnswer) {
          set("leak_location", cleanFreeText(text.replace(/^(?:it's |its |it is )?(?:in |on |at )?(?:the |my |our )?/, "").replace(/[.!]+$/, ""), 60), 0.6, true);
        }
      }
      break;
    case "determine_active_leak":
      if (!has("active_leak")) {
        if (dontKnow) unknownFields.push("active_leak");
        else if (
          /\bnot (?:right now|at the moment|currently|today)\b/.test(text) ||
          /\b(?:not|isn't|isnt|no longer|stopped)\b[^.?!]{0,12}\b(?:leaking|dripping|coming in)\b/.test(text)
        ) {
          set("active_leak", false, 0.85, true);
        }
        else if (yes) set("active_leak", true, 0.9, true);
        else if (no) set("active_leak", false, 0.85, true);
      } else {
        const current = updates.find((update) => update.field === "active_leak");
        if (current) set("active_leak", current.value as boolean, Math.max(current.confidence, 0.9), true);
      }
      break;
    case "determine_start_time":
      if (!has("issue_started") && !has("storm_date")) {
        if (dontKnow) unknownFields.push("issue_started");
        else if (freeTextAnswer) set("issue_started", cleanFreeText(text.replace(/[.!]+$/, ""), 60), 0.5, true);
      }
      break;
    case "determine_storm_damage":
      if (!has("storm_damage")) {
        if (dontKnow) unknownFields.push("storm_damage");
        else if (/\bnot that i know of\b/.test(text)) set("storm_damage", false, 0.6, true);
        else if (/\b(?:wear and tear|just (?:old|age)|age|aging|getting old|old age)\b/.test(text)) set("storm_damage", false, 0.8, true);
        else if (yes) set("storm_damage", true, 0.9, true);
        else if (no) set("storm_damage", false, 0.85, true);
      }
      break;
    case "determine_visible_damage":
      if (!has("visible_damage")) {
        if (dontKnow || /\bhaven't (?:been|gone) (?:up|outside)\b/.test(text)) unknownFields.push("visible_damage");
        else if (no) set("visible_damage", [], 0.8, true);
        else if (yes) {
          const detail = cleanFreeText(text.replace(/^(?:yes|yeah|yep|yup|ya|yah)\b[,.!]?\s*/, "").replace(/[.!]+$/, ""), 80);
          set("visible_damage", [detail && wordCount(detail) >= 2 ? detail : "visible damage reported"], 0.75, true);
        } else if (freeTextAnswer) {
          set("visible_damage", [cleanFreeText(text.replace(/[.!]+$/, ""), 80)], 0.6, true);
        }
      }
      break;
    case "determine_exposed_roof":
      if (!has("exposed_roof")) {
        if (dontKnow) unknownFields.push("exposed_roof");
        else if (yes) set("exposed_roof", true, 0.85, true);
        else if (no) set("exposed_roof", false, 0.85, true);
      }
      break;
    case "determine_interior_damage":
      if (!has("interior_damage")) {
        if (dontKnow) unknownFields.push("interior_damage");
        else if (yes) {
          set("interior_damage", true, 0.85, true);
          const detail = text.replace(/^(?:yes|yeah|yep|yup)\b[,.!]?\s*/, "");
          if (wordCount(detail) >= 2) set("interior_damage_description", cleanFreeText(detail, 100), 0.7, true);
        } else if (no) set("interior_damage", false, 0.85, true);
      }
      break;
    case "determine_replacement_reason":
      if (dontKnow && wordCount(text) <= 5) unknownFields.push("current_condition");
      else if (text && !signals.question && !signals.correction) set("current_condition", cleanFreeText(raw), 0.85, true);
      break;
    case "determine_repair_scope":
      if (dontKnow && wordCount(text) <= 5) unknownFields.push("issue_description");
      else if (text && !signals.question && !signals.correction) {
        set(assessment.issue_description ? "current_condition" : "issue_description", cleanFreeText(raw), 0.85, true);
      }
      break;
    case "determine_inspection_reason":
      if (no || /\b(?:routine|just (?:a )?check|nothing (?:specific|really|in particular)|just want(?:ed)? (?:it|to) (?:checked|check)|peace of mind|just curious)\b/.test(text)) {
        set("current_condition", "No known issues. Routine check.", 0.85, true);
      } else if (text && !signals.question && !signals.correction) {
        set("current_condition", cleanFreeText(raw), 0.85, true);
      }
      break;
    case "request_photo":
      if (!photoShared) {
        if (yes) set("photos_available", true, 0.8, true);
        else if (no || /\b(?:don't have|dont have|can't get|cant get|can't take|no photos?|no pictures?|not right now|maybe later|skip)\b/.test(text)) {
          set("photos_available", false, 0.85, true);
        }
      }
      break;
    case "determine_roof_age":
      if (!has("roof_age") && dontKnow) unknownFields.push("roof_age");
      break;
    case "determine_roof_material":
      if (!has("roof_material")) {
        if (dontKnow) unknownFields.push("roof_material");
        // "Is it an asphalt shingle roof?" "Yes."
        else if (yes && assessment.roof_material) set("roof_material", assessment.roof_material, 0.85, true);
      }
      break;
    case "determine_roof_size":
      if (!has("home_size") && !has("roof_size") && dontKnow) unknownFields.push("home_size", "roof_size");
      break;
    case "determine_stories":
      if (!has("stories") && dontKnow) unknownFields.push("stories");
      break;
    case "determine_replacement_interest":
      if (/\b(?:repair|fix|patch)\b/.test(text) && !/\breplac/.test(text)) {
        set("replacement_interest", false, 0.8, true);
        set("repair_interest", true, 0.85, true);
      } else if (yes || /\b(?:replace|replacement|new roof)\b/.test(text)) set("replacement_interest", true, 0.8, true);
      else if (dontKnow) unknownFields.push("replacement_interest");
      break;
    case "determine_urgency":
      if (!signals.statedUrgency && /\b(?:steady|stable|the same|not (?:getting )?worse|holding)\b/.test(text)) {
        signals.statedUrgency = "normal";
        set("urgency", "normal", 0.8, true);
      } else if (!signals.statedUrgency && dontKnow) {
        unknownFields.push("urgency");
      }
      break;
    case "offer_estimate":
      if (yes || signals.pricingQuestion) estimateAccepted = true;
      else if (no) estimateDeclined = true;
      break;
    case "determine_contact":
    case "determine_phone": {
      const declinePattern = /\b(?:rather not|prefer not|don't want to (?:give|share)|no thanks|not comfortable|i'll pass|skip)\b/;
      if (declinePattern.test(text) || (no && wordCount(text) <= 3)) {
        contactDeclined = true;
        unknownFields.push(target ?? "name");
      }
      break;
    }
    case "determine_address":
      if (!has("address") && !has("zip_code") && (dontKnow || /\b(?:rather not|prefer not|skip)\b/.test(text))) {
        unknownFields.push("address", "zip_code");
      }
      break;
    case "determine_contact_preference": {
      const field = preferenceTarget(assessment);
      if (field === "preferred_contact_method" && !has("preferred_contact_method")) {
        if (/\b(?:either|whatever|any|both|doesn't matter|don't care)\b/.test(text)) set("preferred_contact_method", "phone", 0.6, true);
        else if (yes) set("preferred_contact_method", "text", 0.8, true);
        else if (no) set("preferred_contact_method", "phone", 0.75, true);
      }
      if (field === "preferred_time" && !has("preferred_time")) {
        if (/\b(?:any|whenever|flexible|doesn't matter)\b/.test(text)) set("preferred_time", "anytime", 0.8, true);
        else if (dontKnow || no) unknownFields.push("preferred_time");
        else if (short && text) set("preferred_time", cleanFreeText(text.replace(/[.!]+$/, ""), 60), 0.6, true);
      }
      break;
    }
    case "confirm_detail": {
      const pending = context.pending_confirmation;
      if (pending) {
        const numbers = [...text.matchAll(/\d+(?:,\d{3})*/g)].map((match) => Number(match[0].replace(/,/g, "")));
        if (typeof pending.latest === "number" && typeof pending.previous === "number") {
          const picked = numbers.find((value) => value === pending.latest || value === pending.previous);
          if (picked !== undefined) confirmation = picked;
          else if (/\b(?:first|former|original|earlier)\b/.test(text)) confirmation = pending.previous;
          else if (/\b(?:second|latter|last|newer)\b/.test(text) || yes) confirmation = pending.latest;
        } else {
          const latest = String(pending.latest).toLowerCase();
          const previous = String(pending.previous).toLowerCase();
          if (text.includes(latest.split(" ")[0] ?? latest)) confirmation = pending.latest;
          else if (text.includes(previous.split(" ")[0] ?? previous)) confirmation = pending.previous;
          else if (yes) confirmation = pending.latest;
        }
      }
      break;
    }
    default:
      break;
  }

  if (photoShared) {
    set("photos_uploaded", true, 1);
    set("photos_available", true, 1);
  }

  if (dontKnow && lastGoal) {
    for (const field of goalFields(lastGoal, assessment)) {
      if (!has(field) && !unknownFields.includes(field) && field !== "intent") unknownFields.push(field);
    }
  }
  // "I have no idea how old it is" answers a question before it's asked.
  if (dontKnow) {
    for (const [pattern, fields] of UNKNOWN_TOPICS) {
      if (pattern.test(text)) {
        for (const field of fields) if (!has(field) && !unknownFields.includes(field)) unknownFields.push(field);
      }
    }
  }

  const answeredFields = goalFields(lastGoal, assessment);
  const answeredLastGoal =
    lastGoal !== null &&
    (answeredFields.some((field) => has(field) || unknownFields.includes(field)) ||
      estimateAccepted ||
      estimateDeclined ||
      contactDeclined ||
      confirmation !== null ||
      (lastGoal === "request_photo" && photoShared) ||
      (lastGoal === "identify_issue" && intent !== null));

  return {
    raw,
    text,
    intent,
    signals,
    updates,
    unknownFields: [...new Set(unknownFields)],
    photoShared,
    estimateAccepted,
    estimateDeclined,
    contactDeclined,
    invalidPhone,
    confirmation,
    answeredLastGoal,
  };
}
