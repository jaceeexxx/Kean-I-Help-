import type { Setup } from "./onboarding";
import { countdownMessages, dailyGreetings, dailyMessages, reactionLines } from "@/content/jace-content";
import { loadJacePreferences } from "./jace-preferences";

export type JaceReactionEvent =
  | "lesson-correct"
  | "lesson-miss"
  | "lesson-complete"
  | "exam-high"
  | "exam-mid"
  | "exam-low"
  | "milestone"
  | "plan-built"
  | "return-after-rest";

export type JaceReaction = {
  event: JaceReactionEvent;
  line: string;
  emoji: string;
  tone: "celebrate" | "support" | "focus" | "welcome";
  reactionKey?: string;
};

const DAILY_CACHE_KEY = "kih:jace-daily-message:v1";
const SEEN_REACTIONS_KEY = "kih:jace-reaction-receipts:v1";
const SEEN_MILESTONES_KEY = "kih:jace-milestones-seen:v1";

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value >>> 0);
}

function choose<T>(values: readonly T[], seed: string) {
  return values[hash(seed) % values.length];
}

export function getDailyGreeting(date = new Date()) {
  return choose(dailyGreetings, `greeting:${dateKey(date)}`);
}

export function getCountdownDays(setup: Setup, date = new Date()) {
  if (!setup.targetExamDate) return null;
  const target = new Date(`${setup.targetExamDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((target.getTime() - current.getTime()) / 86_400_000);
}

function computeDailyMessage(setup: Setup, date = new Date()) {
  const days = getCountdownDays(setup, date);
  if (days !== null && countdownMessages[days]) return countdownMessages[days];
  return choose(dailyMessages, `message:${dateKey(date)}`);
}

export function getStableDailyMessage(setup: Setup, date = new Date()) {
  const key = dateKey(date);
  if (typeof window === "undefined") return computeDailyMessage(setup, date);
  try {
    const cached = JSON.parse(localStorage.getItem(DAILY_CACHE_KEY) || "null") as { date: string; message: string } | null;
    if (cached?.date === key && cached.message) return cached.message;
    const message = computeDailyMessage(setup, date);
    localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify({ date: key, message }));
    return message;
  } catch {
    return computeDailyMessage(setup, date);
  }
}

const configs: Record<JaceReactionEvent, { lines: readonly string[]; emoji: string; tone: JaceReaction["tone"] }> = {
  "lesson-correct": { lines: reactionLines.lessonCorrect, emoji: "👏", tone: "celebrate" },
  "lesson-miss": { lines: reactionLines.lessonMiss, emoji: "💛", tone: "support" },
  "lesson-complete": { lines: reactionLines.lessonComplete, emoji: "✨", tone: "celebrate" },
  "exam-high": { lines: reactionLines.examHigh, emoji: "😭👏", tone: "celebrate" },
  "exam-mid": { lines: reactionLines.examMid, emoji: "💙", tone: "focus" },
  "exam-low": { lines: reactionLines.examLow, emoji: "💛", tone: "support" },
  milestone: { lines: reactionLines.milestone, emoji: "🏆", tone: "celebrate" },
  "plan-built": { lines: reactionLines.planBuilt, emoji: "📝", tone: "focus" },
  "return-after-rest": { lines: reactionLines.returnAfterRest, emoji: "😌", tone: "welcome" },
};

export function resolveJaceReaction(event: JaceReactionEvent, reactionKey = `${event}:${Date.now()}`): JaceReaction {
  const config = configs[event];
  return { event, line: choose(config.lines, reactionKey), emoji: config.emoji, tone: config.tone, reactionKey };
}

function readSeenReactions() {
  if (typeof window === "undefined") return {} as Record<string, string>;
  try { return JSON.parse(localStorage.getItem(SEEN_REACTIONS_KEY) || "{}"); } catch { return {}; }
}

export function emitJaceReaction(event: JaceReactionEvent, options?: { reactionKey?: string; once?: boolean }) {
  if (typeof window === "undefined") return false;
  if (!loadJacePreferences().stickerReactionsEnabled) return false;
  const reactionKey = options?.reactionKey || `${event}:${dateKey()}`;
  const seen = readSeenReactions();
  if (options?.once !== false && seen[reactionKey]) return false;
  seen[reactionKey] = new Date().toISOString();
  localStorage.setItem(SEEN_REACTIONS_KEY, JSON.stringify(seen));
  window.dispatchEvent(new CustomEvent<JaceReaction>("jace:reaction", { detail: resolveJaceReaction(event, reactionKey) }));
  return true;
}

export function getNewEarnedMilestoneId(earnedIds: string[]) {
  if (typeof window === "undefined") return null;
  let seen: string[] = [];
  try { seen = JSON.parse(localStorage.getItem(SEEN_MILESTONES_KEY) || "[]"); } catch {}
  const newlyEarned = earnedIds.find(id => !seen.includes(id)) || null;
  const merged = [...new Set([...seen, ...earnedIds])];
  localStorage.setItem(SEEN_MILESTONES_KEY, JSON.stringify(merged));
  return newlyEarned;
}

export function shouldWelcomeAfterRest(setup: Setup, date = new Date()) {
  if (!setup.completed) return false;
  const today = date.getDay();
  const yesterday = (today + 6) % 7;
  return setup.studyDays.includes(today) && setup.restDays.includes(yesterday);
}
