"use client";

import { ArrowRight, ImagePlus, Phone, RotateCcw, Send, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import type { IssueType } from "@/lib/leads/options";

type Role = "advisor" | "user";
type Stage = "issue" | "urgency" | "details" | "roofAge" | "size" | "material" | "name" | "phone" | "email" | "estimate";

type Message = { id: number; role: Role; text: string };
type Answers = {
  issue?: IssueType;
  urgency?: string;
  details?: string;
  roofAge?: string;
  size?: string;
  material?: string;
  name?: string;
  phone?: string;
  email?: string;
};

const issues: Array<{ label: string; value: IssueType }> = [
  { label: "I have a leak", value: "leak" },
  { label: "Storm damage", value: "storm_damage" },
  { label: "I need a repair", value: "repair" },
  { label: "I need a replacement", value: "replacement" },
  { label: "I want an inspection", value: "inspection" },
  { label: "I'm not sure", value: "not_sure" },
];

const urgency = ["It's happening right now", "Within the next few days", "Planning ahead", "I'm not sure"];
const roofAges = ["Less than 5 years", "5–10 years", "10–20 years", "More than 20 years", "Not sure"];
const materials = ["Asphalt shingles", "Metal", "Tile", "Flat / low slope", "Something else", "Not sure"];

function issueLabel(value?: IssueType) {
  return issues.find((item) => item.value === value)?.label ?? "Roofing project";
}

function estimate(answers: Answers): readonly [number, number] | null {
  if (answers.issue === "inspection") return null;
  const bases: Record<string, [number, number]> = {
    leak: [650, 2800],
    storm_damage: [1800, 6200],
    repair: [650, 2400],
    replacement: [8500, 14500],
    not_sure: [1000, 7000],
  };
  const base = bases[answers.issue ?? "not_sure"];
  if (!base) return [1000, 7000];
  const [low, high] = base;
  const size = Number.parseInt(answers.size?.replace(/[^0-9]/g, "") ?? "", 10);
  const sizeFactor = Number.isFinite(size) && size > 0 ? Math.min(1.55, Math.max(0.8, size / 2000)) : 1;
  const urgencyFactor = answers.urgency === "It's happening right now" ? 1.12 : 1;
  const materialFactor = answers.material === "Metal" ? 1.25 : answers.material === "Tile" ? 1.35 : 1;
  const round = (n: number) => Math.round((n * sizeFactor * urgencyFactor * materialFactor) / 50) * 50;
  return [round(low), round(high)] as const;
}

const money = (n: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(n);

function opening(initialIssue?: IssueType) {
  return initialIssue
    ? {
        stage: "urgency" as Stage,
        text: `Got it — you're looking at ${issueLabel(initialIssue).toLowerCase()}. I'll ask a few things so I can put together a preliminary range. How urgent is it?`,
      }
    : {
        stage: "issue" as Stage,
        text: "Hey! I'm here to help you figure out what your roof might need — and put together a preliminary estimate. What's going on with your roof?",
      };
}

function question(stage: Stage, a: Answers): readonly [Stage, string] {
  switch (stage) {
    case "issue": return ["urgency", "How urgent is the situation?"];
    case "urgency":
      return ["details",
        a.issue === "replacement"
          ? "Tell me a little about the roof you're replacing. What made you decide it's time for a new one?"
          : a.issue === "storm_damage"
            ? "What did the storm damage? For example, shingles, flashing, gutters, or something inside the home."
            : a.issue === "inspection"
              ? "What would you like us to look for during the inspection?"
              : "Tell me a little more about what you're seeing. Where is the problem and what have you noticed?"];
    case "details": return ["roofAge", "Do you know roughly how old the roof is?"];
    case "roofAge": return ["size", "About how large is the home? An approximate square footage is fine — if you're not sure, just say so."];
    case "size": return ["material", "What kind of roofing material do you have or want?"];
    case "material": return ["name", "Great. What's your name?"];
    case "name": return ["phone", `Thanks, ${a.name ?? "there"}. What's the best phone number to reach you?`];
    case "phone": return ["email", "And what email should we send the assessment details to?"];
    case "email": return ["estimate", "Perfect. I've got what I need. Let me put that together for you."];
    default: return ["estimate", "I've got what I need."];
  }
}

export function AdvisorChat({
  initialIssue,
  onClose,
}: {
  initialIssue?: IssueType;
  onClose?: () => void;
}) {
  const first = opening(initialIssue);
  const [stage, setStage] = useState<Stage>(first.stage);
  const [answers, setAnswers] = useState<Answers>(initialIssue ? { issue: initialIssue } : {});
  const [messages, setMessages] = useState<Message[]>([{ id: 1, role: "advisor", text: first.text }]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [id, setId] = useState(2);
  const [photos, setPhotos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (typing || stage === "estimate") return [];
    if (stage === "issue") return issues.map((x) => x.label);
    if (stage === "urgency") return urgency;
    if (stage === "roofAge") return roofAges;
    if (stage === "material") return materials;
    return [];
  }, [stage, typing]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!typing && stage !== "estimate") window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [stage, typing]);

  function answer(raw: string) {
    const value = raw.trim();
    if (!value || typing || stage === "estimate") return;

    const next = { ...answers };
    if (stage === "issue") next.issue = issues.find((x) => x.label === value)?.value ?? "not_sure";
    if (stage === "urgency") next.urgency = value;
    if (stage === "details") next.details = value;
    if (stage === "roofAge") next.roofAge = value;
    if (stage === "size") next.size = value;
    if (stage === "material") next.material = value;
    if (stage === "name") next.name = value;
    if (stage === "phone") next.phone = value;
    if (stage === "email") next.email = value;

    setInput("");
    setMessages((current) => [...current, { id, role: "user", text: value }]);
    setId((n) => n + 1);
    setAnswers(next);
    setTyping(true);

    window.setTimeout(() => {
      const [nextStage, text] = question(stage, next);
      const nextEstimate = nextStage === "estimate" ? estimate(next) : null;
      const finalText =
        nextStage === "estimate"
          ? nextEstimate
            ? `Based on what you've told me, your preliminary range is **${money(nextEstimate[0])} – ${money(nextEstimate[1])}**. That's a planning range, not a final quote — exact pricing depends on the measured roof, condition, materials and inspection.`
            : "Based on what you've told me, the right next step is an on-site inspection. I don't want to invent a price before someone has seen the roof."
          : text;
      setMessages((current) => [...current, { id: id + 1, role: "advisor", text: finalText }]);
      setId((n) => n + 1);
      setStage(nextStage);
      setTyping(false);
    }, 620);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    answer(input);
  }

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const count = Math.min(4, event.target.files?.length ?? 0);
    if (!count) return;
    setPhotos((n) => n + count);
    setMessages((current) => [...current, {
      id,
      role: "user",
      text: `Added ${count === 1 ? "a photo" : `${count} photos`} of my roof.`,
    }]);
    setId((n) => n + 1);
  }

  function restart() {
    const fresh = opening();
    setStage(fresh.stage);
    setAnswers({});
    setMessages([{ id: 1, role: "advisor", text: fresh.text }]);
    setInput("");
    setPhotos(0);
    setTyping(false);
    setId(2);
  }

  const range = estimate(answers);

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-canvas text-ink">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-brand-strong text-sm font-bold text-white">R1</div>
          <div>
            <p className="text-sm font-semibold">Roof One</p>
            <p className="text-xs text-ink-muted">Roofing Advisor <span className="text-success">• online</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={restart} className="hidden h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-muted hover:bg-subtle hover:text-ink sm:inline-flex">
            <RotateCcw className="size-4" /> Start over
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-subtle hover:text-ink" aria-label="Close Roofing Advisor">
              <X className="size-5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-line bg-surface p-7 lg:block">
          <p className="text-[11px] font-bold uppercase tracking-eyebrow text-brand">Roofing Advisor</p>
          <h1 className="mt-4 font-headline text-3xl leading-[0.98]">Let's figure out what your roof needs.</h1>
          <p className="mt-4 text-sm leading-6 text-ink-muted">A few quick questions help us build a preliminary range and prepare the right next step.</p>
          <div className="mt-10 border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-ink-muted">Your assessment</p>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Project", answers.issue ? issueLabel(answers.issue) : "Waiting"],
                ["Urgency", answers.urgency ?? "Waiting"],
                ["Roof age", answers.roofAge ?? "Waiting"],
                ["Size", answers.size ?? "Waiting"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-ink-muted">{label}</span>
                  <span className="max-w-[130px] text-right font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="mb-7 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted">
                  <span className="size-1.5 rounded-full bg-success" /> Private assessment
                </span>
              </div>

              {messages.map((message) => (
                <div key={message.id} className={message.role === "advisor" ? "flex items-start gap-3" : "flex justify-end"}>
                  {message.role === "advisor" && <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-strong text-[10px] font-bold text-white">R1</div>}
                  <div className={message.role === "advisor"
                    ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5 text-[15px] leading-6 shadow-[0_1px_2px_rgb(7_19_31/0.04)]"
                    : "max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-brand px-4 py-3.5 text-[15px] leading-6 text-white"}>
                    {message.text.split("**").map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-brand-strong text-[10px] font-bold text-white">R1</div>
                  <div className="flex h-11 items-center gap-1.5 rounded-2xl rounded-tl-md border border-line bg-white px-4">
                    <span className="size-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.2s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.1s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-ink-muted" />
                  </div>
                </div>
              )}

              {photos > 0 && <p className="ml-11 text-xs text-ink-muted">{photos} photo{photos === 1 ? "" : "s"} attached</p>}

              {stage === "estimate" && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-brand bg-brand-soft">
                  <div className="border-b border-brand/15 bg-brand px-5 py-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-eyebrow text-blue-100">Your preliminary assessment</p>
                    <p className="mt-1 text-lg font-semibold">{issueLabel(answers.issue)}</p>
                  </div>
                  <div className="p-5 sm:p-6">
                    {range ? (
                      <>
                        <p className="text-sm font-semibold text-ink-muted">Estimated project range</p>
                        <p className="mt-1 font-headline text-4xl text-brand-strong sm:text-5xl">{money(range[0])} – {money(range[1])}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-headline text-2xl">Inspection first</p>
                        <p className="mt-2 text-sm leading-6 text-ink-muted">We don't want to guess at a price without seeing the roof.</p>
                      </>
                    )}
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {[
                        ["Project", issueLabel(answers.issue)],
                        ["Roof age", answers.roofAge ?? "Not provided"],
                        ["Home size", answers.size ?? "Not provided"],
                        ["Material", answers.material ?? "Not provided"],
                      ].map(([label, value]) => (
                        <div key={label} className="border-t border-brand/15 pt-3">
                          <p className="text-xs text-ink-muted">{label}</p>
                          <p className="mt-0.5 text-sm font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-xs leading-5 text-ink-muted">This is a preliminary planning range, not a final quote. Exact pricing depends on measured roof area, condition, materials, access, local requirements and the work confirmed during inspection.</p>
                    <a href={siteConfig.phone.href} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong">
                      <Phone className="size-4" /> Request an inspection <ArrowRight className="size-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {stage !== "estimate" && (
            <div className="shrink-0 border-t border-line bg-white px-4 py-4 sm:px-7">
              <div className="mx-auto max-w-2xl">
                {suggestions.length > 0 && (
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {suggestions.map((item) => (
                      <button key={item} type="button" disabled={typing} onClick={() => answer(item)} className="shrink-0 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium hover:border-brand hover:bg-brand-soft hover:text-brand disabled:opacity-50">
                        {item}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-control bg-surface p-1.5 pl-4 shadow-[0_4px_20px_rgb(7_19_31/0.06)] focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
                  <label className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-white hover:text-brand" title="Add roof photos">
                    <ImagePlus className="size-5" />
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={addPhotos} disabled={typing} />
                    <span className="sr-only">Add roof photos</span>
                  </label>
                  <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tell us what's happening..." disabled={typing} className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-ink-muted" aria-label="Your message" />
                  <button type="submit" disabled={!input.trim() || typing} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message">
                    <Send className="size-4" />
                  </button>
                </form>
                <p className="mt-2 text-center text-[11px] text-ink-muted">You can type naturally or choose a suggested answer.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
