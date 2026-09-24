import type { AdvisorIntent, AdvisorUrgency, PolicyTopic } from "./types";

/*
 * Deterministic intent and signal detection.
 *
 * This is the advisor's baseline understanding: it runs on every message,
 * works without an AI provider, and hands its findings to the AI as hints
 * when one is configured. Patterns run on normalized, lower-case text.
 */

export interface IntentDetection {
  value: AdvisorIntent;
  confidence: number;
  /** Asked for directly ("I need a new roof"), not inferred from symptoms. */
  explicit: boolean;
}

export type GeneralTopic =
  | "lifespan"
  | "repair_or_replace"
  | "can_it_wait"
  | "meantime"
  | "cause";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const HEDGES =
  /\b(?:i think|i guess|i believe|i'd say|maybe|might|probably|possibly|perhaps|could be|not sure but|seems like|looks like|kind of|kinda|sort of|roughly|about|around|approximately|or so|give or take|ish)\b/;

export function isHedged(text: string): boolean {
  return HEDGES.test(text);
}

const NEGATORS =
  /\b(?:no|not|never|none|without|nothing|isn't|aren't|wasn't|weren't|doesn't|don't|didn't|hasn't|haven't|hadn't|won't|can't|cannot|dont|doesnt|didnt|isnt|wasnt)\b/;

// "not sure where it's leaking" still says it's leaking.
const PRESUPPOSING_UNCERTAINTY =
  /\b(?:not sure|don't know|dont know|no idea|unsure|can't tell)\s+(?:where|when|how|why|what|which)\b/g;

/** Whether the words just before `index`, in the same clause, negate what follows. */
export function isNegatedAt(text: string, index: number): boolean {
  const before = text.slice(0, index);
  const boundary = Math.max(
    before.lastIndexOf(","),
    before.lastIndexOf("."),
    before.lastIndexOf(";"),
    before.lastIndexOf("!"),
    before.lastIndexOf("?"),
    before.lastIndexOf(" but "),
    before.lastIndexOf(" and "),
    before.lastIndexOf(" - "),
  );
  const window = before
    .slice(boundary + 1)
    .replace(PRESUPPOSING_UNCERTAINTY, " ")
    .trim()
    .split(/\s+/)
    .slice(-4)
    .join(" ");
  return NEGATORS.test(window);
}

function globalize(pattern: RegExp): RegExp {
  return new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );
}

/** The first match of any pattern that isn't negated ("no leaks", "not leaking"). */
export function findAffirmed(
  text: string,
  patterns: readonly RegExp[],
): RegExpExecArray | null {
  for (const pattern of patterns) {
    const re = globalize(pattern);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (!isNegatedAt(text, match.index)) return match;
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
  return null;
}

/** Whether any pattern matches only in a negated clause. */
export function findNegated(
  text: string,
  patterns: readonly RegExp[],
): RegExpExecArray | null {
  for (const pattern of patterns) {
    const re = globalize(pattern);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (isNegatedAt(text, match.index)) return match;
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Situation vocabulary
// ---------------------------------------------------------------------------

export const LEAK_PATTERNS = [
  /\bleak(?:s|ing|ed|y|age)?\b/,
  /\bdrip(?:s|ping|ped|py)?\b/,
  /\b(?:water|rain|moisture)\b[^.?!]{0,40}\b(?:coming|getting|leaking|seeping|pouring|running|pooling|dripping|gushing|streaming|trickling|showing)\b/,
  /\bwater\b[^.?!]{0,30}\b(?:through|into|onto)\b/,
  /\b(?:ceiling|walls?|attic|room|bedroom|kitchen|bathroom|living room|house|floor|carpet|insulation|drywall)\b[^.?!]{0,25}\b(?:gets?|getting|got|is|are|was|were|goes)\s+(?:all\s+|really\s+|so\s+)?(?:wet|damp|soaked|soggy|flooded)\b/,
  /\b(?:wet|damp|soaked|soggy)\s+(?:ceiling|walls?|attic|insulation|drywall|carpet|floor|spots?)\b/,
  /\bwater damage\b/,
  /\bbuckets?\b/,
  /\bpuddles?\b/,
] as const;

/** Signs of water getting in without the word "leak". */
export const LEAK_SYMPTOM_PATTERNS = [
  /\bstain(?:s|ed|ing)?\b/,
  /\b(?:water|dark|brown|yellow|wet)\s+(?:spots?|marks?|rings?|patches?)\b/,
  /\bdiscolou?r(?:ed|ation|ing)\b/,
  /\bmou?ld(?:y)?\b/,
  /\bmildew\b/,
  /\bbubbl(?:e|es|ing|ed)\b[^.?!]{0,20}\b(?:paint|ceiling|drywall)\b/,
  /\bpeeling paint\b/,
  /\bmusty\b/,
] as const;

export const STORM_PATTERNS = [
  /\b(?:storms?|stormy|hail(?:storm|stones?)?|hurricanes?|tornado(?:es)?|tropical storm|wind ?storms?|thunderstorms?|derecho|nor'?easters?|blizzard|ice storm|bad weather|severe weather|microburst)\b/,
  /\b(?:high|strong|heavy|big|crazy|bad)\s+winds?\b/,
  /\bwind\s+(?:damage|blew|tore|ripped)\b/,
  /\b(?:blew|blown)\s+(?:off|away|loose|up)\b/,
  /\btree\b[^.?!]{0,30}\b(?:fell|fallen|came down|hit|landed|crashed|went through)\b/,
  /\bfallen tree\b/,
  /\b(?:branch|limb)(?:es|s)?\b[^.?!]{0,25}\b(?:fell|came down|hit|landed|crashed|went through)\b/,
] as const;

export const PARTIAL_SHINGLE_REPAIR =
  /\b(?:replac(?:e|ed|ing)|fix(?:ed)?|repair(?:ed)?|patch(?:ed)?)\s+(?:a few|a couple(?: of)?|some|one|two|three|several|the missing|a missing|a|the|few|those|these)\s+(?:missing\s+|damaged\s+|broken\s+|loose\s+)?shingles?\b|\b(?:a few|a couple(?: of)?|some|one|two|three|several|few)\s+(?:missing\s+|damaged\s+|broken\s+|loose\s+)?shingles?\s+(?:replaced|fixed|repaired|patched)\b/;

export const REPLACEMENT_PATTERNS = [
  /\b(?:new|full|whole|entire|complete)\s+roof\b/,
  /\broof\s+replacement\b/,
  /\breplac(?:e|ing|ed)\s+(?:the|my|our|a|this)?\s*(?:whole |entire |full )?roof\b/,
  /\b(?:full|complete|total)\s+replacement\b/,
  /\breplacement\b/,
  /\bre-?roof(?:ing|ed)?\b/,
  /\btear[- ]?off\b/,
  /\bredo(?:ing)?\s+(?:the|my|our)\s+(?:whole |entire )?roof\b/,
] as const;

export const REPAIR_PATTERNS = [
  PARTIAL_SHINGLE_REPAIR,
  /\brepair(?:s|ed|ing)?\b/,
  /\bfix(?:ed|ing)?\b/,
  /\bpatch(?:ed|ing)?\b/,
  /\b(?:flashing|gutters?|fascia|soffits?|vents?|pipe boot|chimney cap|drip edge)\b[^.?!]{0,30}\b(?:loose|bent|damaged|broken|coming off|pulling|rusted|cracked|missing|needs)\b/,
] as const;

export const INSPECTION_PATTERNS = [
  /\binspect(?:ion|ions|ed|or)?\b/,
  /\b(?:take|have)\s+a\s+look\b/,
  /\blook\s+(?:at|over)\b[^.?!]{0,15}\b(?:roof|it)\b/,
  /\bcheck\s+(?:out\s+|on\s+)?(?:the|my|our)\s+roof\b/,
  /\b(?:roof\s+)?(?:evaluation|check-?up|once-?over|certification)\b/,
  /\b(?:buying|selling|sell|buy|closing on)\s+(?:a|the|our|my|this)?\s*(?:house|home)\b/,
  /\broutine\s+check\b/,
] as const;

const UNSURE_PATTERNS = [
  /\b(?:don't|do not|dont) know what'?s?\b[^.?!]{0,20}\b(?:wrong|going on|happening|up)\b/,
  /\bnot sure what'?s?\b[^.?!]{0,20}\b(?:wrong|going on|happening)\b/,
  /\bsomething(?:'s| is| seems| looks)?\s+(?:wrong|off|weird|strange|not right)\b/,
  /\bno idea what\b/,
  /^(?:i'm\s+|im\s+)?(?:not sure|unsure|no idea|idk|i don't know|dunno)[.!?]*$/,
] as const;

export const PRICING_PATTERN =
  /\b(?:how much|costs?|costing|price[sd]?|pricing|quotes?|estimates?|ballpark|rough (?:range|idea|number|price)|budget|expensive|afford|what (?:would|will|does) (?:it|that|this) (?:run|be)|what'?s (?:it|that) (?:going to|gonna) (?:cost|run|be))\b/;

const QUESTION_START =
  /^(?:how|what|what's|whats|when|where|why|who|which|can|could|do|does|did|is|are|was|will|would|should|may|might)\b/;

export function isQuestion(text: string): boolean {
  return /\?\s*$/.test(text) || (QUESTION_START.test(text) && wordCount(text) > 2);
}

/**
 * The homeowner's primary intent in this message, if it has one. A request
 * for a new roof outranks symptoms; an active leak outranks storm context.
 */
export function detectIntent(text: string): IntentDetection | null {
  const hedged = isHedged(text);
  const asksPrice = PRICING_PATTERN.test(text);
  const partialRepair = PARTIAL_SHINGLE_REPAIR.test(text);

  const replacement = !partialRepair && findAffirmed(text, REPLACEMENT_PATTERNS);
  const leak = findAffirmed(text, LEAK_PATTERNS);
  const leakSymptom = leak ? null : findAffirmed(text, LEAK_SYMPTOM_PATTERNS);
  const storm = findAffirmed(text, STORM_PATTERNS);
  const repair = findAffirmed(text, REPAIR_PATTERNS);
  const inspection = findAffirmed(text, INSPECTION_PATTERNS);

  if (replacement && !leak && asksPrice && isQuestion(text)) {
    return { value: "pricing", confidence: 0.9, explicit: true };
  }
  if (replacement) {
    return { value: "replacement", confidence: hedged ? 0.75 : 0.9, explicit: true };
  }
  if (leak) {
    return { value: "leak", confidence: hedged ? 0.75 : 0.92, explicit: true };
  }
  if (storm) {
    return { value: "storm_damage", confidence: hedged ? 0.75 : 0.9, explicit: true };
  }
  if (leakSymptom) {
    return { value: "leak", confidence: 0.7, explicit: false };
  }
  if (repair) {
    return { value: "repair", confidence: hedged ? 0.7 : 0.85, explicit: true };
  }
  if (inspection) {
    return { value: "inspection", confidence: 0.9, explicit: true };
  }
  if (asksPrice && isQuestion(text)) {
    return { value: "pricing", confidence: 0.8, explicit: true };
  }
  if (UNSURE_PATTERNS.some((pattern) => pattern.test(text))) {
    return { value: "unknown", confidence: 0.8, explicit: true };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Conversational signals
// ---------------------------------------------------------------------------

const HUMAN_PATTERNS = [
  /\b(?:speak|talk|chat)\s+(?:to|with)\s+(?:a |an |the |some |your )?(?:real |actual |live )?(?:someone|somebody|person|human|people|rep|representative|agent|roofer|manager|owner|team|staff|guy|expert|professional|specialist)\b/,
  /\b(?:real|actual|live)\s+(?:person|human|people)\b/,
  /\b(?:can|could|would|will)\s+(?:someone|somebody|you|a person|anyone|the team)\s+(?:just\s+)?(?:please\s+)?(?:call|phone|ring)\s+me\b/,
  /\b(?:have|get)\s+(?:someone|somebody|a person|the team|a roofer)\s+(?:to\s+)?(?:call|phone|contact|reach out to)\s+me\b/,
  /\bcall(?:ing)?\s+me\s+back\b/,
  /\bcall ?back\b/,
  /\b(?:want|need|prefer|rather)\s+(?:a |to talk to a |to speak to a |to speak with a )?(?:human|person)\b/,
  /\bcustomer service\b/,
  /\boperator\b/,
  /\b(?:what's|whats|what is|give me)\s+(?:your|the)\s+(?:phone )?number\b/,
  /\bcan i (?:just )?(?:call|phone|ring) (?:you|someone|the office|the team)\b/,
] as const;

const CALLBACK_PATTERN =
  /\b(?:call(?:ing)?\s+me(?:\s+back)?|call ?back|phone me|ring me|(?:have|get) (?:someone|somebody|the team) (?:to )?call)\b/;

const CONTINUE_PATTERN =
  /\b(?:keep (?:chatting|going|talking)|continue(?: (?:here|chatting|the chat|in (?:the )?chat))?|stay (?:here|in (?:the )?chat)|(?:chat|chatting) (?:is fine|here)|let's keep going|carry on)\b/;

const STOP_LEAD =
  /^(?:(?:ok(?:ay)?|oh|um+|actually|you know what)[,.!]?\s+)?(?:never ?mind|nvm|forget (?:it|about it|this)|(?:please\s+)?stop(?!\s+(?:leaking|dripping))|cancel|quit|exit|end (?:the )?chat|not interested|leave me alone|go away|i (?:don't|do not) want to (?:do this|continue|keep going|go on|talk about (?:it|this))|don't want to do this|i changed my mind|i'm not doing this)\b/;
const STOP_WHOLE =
  /^(?:bye|goodbye|good bye|bye bye|cya|see ya|later|done|i'm done|im done|stop|quit|cancel|exit|no thanks|no thank you|nope,? i'm good)[.!]*$/;
const NOT_A_STOP = /^(?:(?:ok(?:ay)?|oh|actually)[,.!]?\s+)?never ?mind\s+(?:the|that|about|what|my|i)\b/;

const DECLINE_WHOLE =
  /^(?:no thanks?|no thank you|not right now|not now|maybe later|i'm good|im good|i'm ok(?:ay)?|pass|skip|nah,? (?:i'm good|thanks))[.!]*$/;

const OFF_TOPIC_PATTERNS = [
  /\b(?:weather|forecast)\b[^.?!]{0,30}\b(?:tomorrow|today|tonight|this week|weekend|going to|gonna|will it|like)\b/,
  /\bwhat'?s the weather\b/,
  /\bweather\s*\??$/,
  /\b(?:tell me a joke|a joke|poem|song lyrics|recipe|movies?|sports|the score|stock price|stocks|bitcoin|crypto|election|president|capital of|translate|homework|math problem)\b/,
  /\bwho (?:won|is winning)\b/,
  /\bwhat time is it\b/,
] as const;

const ROOF_TOPIC =
  /\b(?:roofs?|roofing|leak\w*|shingles?|gutters?|ceilings?|attic|chimney|flashing|storms?|hail|water|stains?|tiles?|metal|inspect\w*|estimates?|repairs?|replace\w*|skylights?|vents?|soffits?|fascia|drip\w*|house|home)\b/;

const BOT_PATTERN =
  /\b(?:are you|is this|am i (?:talking|chatting|speaking) (?:to|with))\s+(?:a |an )?(?:real |actual )?(?:bot|robot|ai|a\.i\.|chatbot|human|person|computer|machine|automated|real person|live person)\b/;

const GREETING_ONLY =
  /^(?:hi|hello|hey|hiya|howdy|yo|hey there|hi there|hello there|good (?:morning|afternoon|evening))[!.,\s]*$/;

const THANKS_ONLY =
  /^(?:(?:ok(?:ay)?|great|perfect|awesome|cool)[,!.]?\s*)?(?:thanks?|thank you|thx|ty|cheers|appreciate it|much appreciated)(?:\s+(?:so much|a lot|very much))?[!.\s]*$/;

export const DONT_KNOW_PATTERN =
  /\b(?:no idea|not sure|unsure|i don't know|i do not know|don't know|dont know|dunno|idk|no clue|can't tell|cant tell|cannot tell|couldn't tell you|not certain|hard to say|haven't (?:checked|looked)|didn't (?:check|look)|can't see|cant see|i forget|i'm not positive|beats me)\b/;

const AFFIRMATIVE_LEAD =
  /^(?:yes|yeah|yea|yep|yup|ya|yah|definitely|absolutely|indeed|of course|for sure|it is|it does|it did|there is|there are|there was|there were|i do|i did|we do|we did|we have|i have)\b/;
/** Only a "yes" when they're most of the message: "Sure." but not "Right now it's dripping". */
const AFFIRMATIVE_SHORT =
  /^(?:sure|ok(?:ay)?|correct|right|exactly|please|go ahead|sounds good|that works|why not|let's do it)\b/;
const AFFIRMATIVE_ANY =
  /\b(?:yes|yeah|yep|yup|i think so|pretty sure|i believe so|seems like it|looks like it|it is|it does)\b/;
const NEGATIVE_LEAD =
  /^(?:no|nope|nah|negative|not really|not at all|none|nothing|never)\b/;
const NEGATIVE_ANY =
  /\b(?:i don't think so|doesn't (?:look|seem) like it|not that i (?:know of|can see|noticed|saw)|haven't (?:seen|noticed) (?:any|anything)|didn't (?:see|notice) (?:any|anything)|nothing (?:that )?i can see|none that i (?:know of|can see)|not anymore|no longer|it stopped|has stopped)\b/;

const CORRECTION_PATTERN =
  /^(?:actually|sorry|oops|wait|correction|i meant|i mean|scratch that|let me correct)\b|\b(?:actually|i meant|correction|scratch that)\b/;

const WANTS_VISIT_PATTERN =
  /\b(?:come out|come by|send (?:someone|somebody|a roofer|out)|schedule|book (?:a|an|the)|set up (?:a|an)\s*(?:appointment|inspection|visit)|appointment|site visit|in person)\b/;

const POLICY_PATTERNS: ReadonlyArray<readonly [PolicyTopic, RegExp]> = [
  [
    "inspection_fee",
    /\b(?:free|charge|fee|cost|pay)\b[^.?!]{0,25}\b(?:inspections?|estimates?|quotes?|assessments?|consultations?)\b|\b(?:inspections?|estimates?|quotes?|assessments?)\b[^.?!]{0,15}\b(?:free|cost anything|charge)\b/,
  ],
  ["insurance", /\binsurance\b|\bclaims?\b|\badjusters?\b/],
  [
    "financing",
    /\bfinanc(?:e|ing|ed)\b|\bpayment plans?\b|\bmonthly payments?\b|\bpay (?:over time|monthly|in installments)\b|\binstallments?\b/,
  ],
  [
    "service_area",
    /\b(?:do you|you guys|y'all|does roof one)\s+(?:service|serve|cover|work in|come to|go to|operate in|do work in)\b|\bservice area\b|\b(?:are you|you guys)\s+(?:local|nearby|near me|in my area)\b|\bwhat areas?\b/,
  ],
  [
    "availability",
    /\bhow (?:soon|quickly|fast)\b|\bwhen can (?:someone|somebody|you|a roofer|the team)\b|\bsame[- ]day\b|\b(?:come out|be out|get out|come by|stop by)\s+(?:today|tomorrow|this week|tonight|soon)\b|\bemergency service\b|\b24\/7\b|\bavailable\s+(?:today|tomorrow|this week|on weekends?|tonight)\b|\bhow long (?:until|before|till)\b|\bhow long (?:does|will|would) (?:a |the |it )?(?:repair|replacement|job|install\w*|it) take\b/,
  ],
  [
    "hours",
    /\b(?:business|office|your|opening)\s+hours\b|\bare you open\b|\bwhat time do you (?:open|close)\b|\bopen on (?:weekends?|saturdays?|sundays?)\b/,
  ],
  ["warranty", /\bwarrant(?:y|ies)\b|\bguarantee(?:s|d)?\b/],
  ["licensing", /\b(?:licensed|insured|bonded|certified|certifications?|licen[cs]e)\b/],
  [
    "experience",
    /\bhow long have you been\b|\byears in business\b|\b(?:reviews?|ratings?|references?|testimonials?)\b|\bhow many (?:roofs|years|jobs)\b/,
  ],
];

const GENERAL_TOPIC_PATTERNS: ReadonlyArray<readonly [GeneralTopic, RegExp]> = [
  [
    "lifespan",
    /\bhow long (?:do|does|will|should|can)\b[^.?!]{0,30}\b(?:roofs?|shingles?|metal|tiles?)\b[^.?!]{0,15}\blast\b|\b(?:life ?span|life expectancy)\b/,
  ],
  [
    "repair_or_replace",
    /\b(?:repair|fix)(?:ed)?\s+or\s+replace(?:d)?\b|\breplace(?:d)?\s+or\s+(?:repair|fix)(?:ed)?\b|\bdo i need a (?:new|whole|full) roof\b|\bshould i (?:repair|replace|fix)\b/,
  ],
  [
    "can_it_wait",
    /\b(?:can|should|could) (?:it|this|i|we)\s+(?:wait|hold off|leave it)\b|\bis (?:it|this|that) (?:urgent|serious|bad|dangerous|an emergency)\b|\bhow (?:urgent|serious|bad) is\b/,
  ],
  [
    "meantime",
    /\bwhat (?:should|can|do) i do\b|\bin the meantime\b|\bmeanwhile\b|\buntil (?:someone|you|they) (?:can )?(?:come|get here)\b|\btemporar(?:y|ily)\b/,
  ],
  [
    "cause",
    /\bwhat (?:causes?|caused|could cause|would cause)\b|\bwhy (?:is|does|would) (?:my|the|it)\b[^.?!]{0,20}\b(?:leak|drip|stain)/,
  ],
];

const EMERGENCY_WORDS =
  /\b(?:pouring|gushing|streaming in|flooding|flooded|coming in fast|lots of water|a lot of water|so much water|water everywhere)\b/;
const STRUCTURAL_PATTERNS = [
  /\b(?:ceiling|roof)\b[^.?!]{0,20}\b(?:caving|caved|collaps\w*|sagging|sags|bulging|bowing|fell in|falling in|came down|coming down)\b/,
  /\b(?:caving|caved|collaps\w*)\b[^.?!]{0,20}\b(?:ceiling|roof)\b/,
  /\bhole(?:s)? in (?:the|my|our) roof\b/,
  /\bcan see (?:the )?(?:sky|daylight|sunlight)\b/,
  /\bopen to the (?:sky|elements|weather)\b/,
  /\btree\b[^.?!]{0,30}\b(?:through|into|on)\s+(?:the|my|our)\s+(?:roof|house|home|ceiling)\b/,
  /\b(?:part of|section of|chunk of|piece of)\s+(?:the |my |our )?roof\b[^.?!]{0,20}\b(?:gone|missing|blew off|blown off|torn off|ripped off|came off)\b/,
] as const;
const ELECTRICAL_PATTERN =
  /\b(?:light fixtures?|lights?|outlets?|electrical|electric|wiring|wires|breaker|panel|ceiling fan|smoke detectors?|sparks?|sparking|can lights?|recessed lights?)\b/;

export interface MessageSignals {
  humanRequest: boolean;
  callbackRequest: boolean;
  continueChat: boolean;
  stop: boolean;
  decline: boolean;
  pricingQuestion: boolean;
  outOfScope: boolean;
  botQuestion: boolean;
  question: boolean;
  greetingOnly: boolean;
  thanksOnly: boolean;
  dontKnow: boolean;
  affirmative: boolean;
  negative: boolean;
  correction: boolean;
  wantsVisit: boolean;
  policyTopic: PolicyTopic | null;
  generalTopic: GeneralTopic | null;
  emergency: boolean;
  electricalHazard: boolean;
  statedUrgency: AdvisorUrgency | null;
}

export function detectSignals(text: string): MessageSignals {
  const question = isQuestion(text);
  const dontKnow = DONT_KNOW_PATTERN.test(text);
  const negative =
    !dontKnow && (NEGATIVE_LEAD.test(text) || NEGATIVE_ANY.test(text));
  const words = wordCount(text);
  const affirmative =
    !negative &&
    (AFFIRMATIVE_LEAD.test(text) ||
      (AFFIRMATIVE_SHORT.test(text) && words <= 4) ||
      (AFFIRMATIVE_ANY.test(text) && words <= 6));

  const botQuestion = BOT_PATTERN.test(text);
  // "Am I talking to a real person?" asks what we are; "Can I talk to a person?" asks for one.
  const humanRequest = botQuestion
    ? HUMAN_PATTERNS.some((pattern, index) => index !== 1 && pattern.test(text))
    : HUMAN_PATTERNS.some((pattern) => pattern.test(text));
  const stop =
    !NOT_A_STOP.test(text) && (STOP_LEAD.test(text) || STOP_WHOLE.test(text));

  const policyTopic = question
    ? (POLICY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? null)
    : null;
  const generalTopic = question
    ? (GENERAL_TOPIC_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? null)
    : null;

  const leakContext =
    LEAK_PATTERNS.some((pattern) => pattern.test(text)) ||
    /\bwater\b/.test(text);
  const structural = STRUCTURAL_PATTERNS.some((pattern) => pattern.test(text));
  const pouring = EMERGENCY_WORDS.test(text) && leakContext;
  const electricalHazard =
    leakContext && ELECTRICAL_PATTERN.test(text) && !isNegatedAt(text, text.search(ELECTRICAL_PATTERN));

  return {
    humanRequest,
    callbackRequest: humanRequest && CALLBACK_PATTERN.test(text),
    continueChat: CONTINUE_PATTERN.test(text),
    stop,
    decline: DECLINE_WHOLE.test(text),
    pricingQuestion:
      PRICING_PATTERN.test(text) && policyTopic !== "inspection_fee",
    outOfScope:
      !ROOF_TOPIC.test(text) &&
      OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text)),
    botQuestion,
    question,
    greetingOnly: GREETING_ONLY.test(text),
    thanksOnly: THANKS_ONLY.test(text),
    dontKnow,
    affirmative,
    negative,
    correction: CORRECTION_PATTERN.test(text),
    wantsVisit: WANTS_VISIT_PATTERN.test(text),
    policyTopic,
    generalTopic,
    emergency: structural || pouring,
    electricalHazard,
    statedUrgency: detectStatedUrgency(text),
  };
}

function detectStatedUrgency(text: string): AdvisorUrgency | null {
  if (/\b(?:not urgent|no rush|no hurry|not in a hurry|planning ahead|just planning|down the road|eventually|next (?:year|spring|summer|fall|winter)|in a few months|getting quotes|just curious|budgeting|shopping around|just looking)\b/.test(text)) {
    return "low";
  }
  if (/\b(?:it's an emergency|this is an emergency|emergency)\b/.test(text)) {
    return "emergency";
  }
  if (/\b(?:urgent|asap|as soon as possible|right away|immediately|today if possible|can't wait|getting worse)\b/.test(text)) {
    return "high";
  }
  if (/\b(?:in the next (?:few weeks|month|couple (?:of )?months)|sometime soon|next month|within a month|in a few weeks)\b/.test(text)) {
    return "normal";
  }
  return null;
}
