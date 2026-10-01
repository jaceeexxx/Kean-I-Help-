import { areas, getTopic, type AreaKey } from "./curriculum";
import { getExam, listSubmittedAttempts } from "./exam-store";
import { getProgressSnapshot } from "./progress";
import { loadSetup } from "./onboarding";

const STATE_KEY = "kih:adaptive-review-state:v1";
const PLAN_KEY = "kih:adaptive-plan:v1";

export type ReviewRating = "hard" | "okay" | "easy";
export type AdaptiveMode = "baseline" | "remediation" | "targeted-practice" | "speed-drill" | "spaced-review" | "mixed";

export type AdaptiveReviewState = {
  areaKey: AreaKey;
  topicSlug: string;
  lastReviewedAt: string;
  nextDueAt: string;
  intervalDays: number;
  reviewCount: number;
  lastRating: ReviewRating;
};

export type AdaptivePriority = {
  areaKey: AreaKey;
  areaShort: string;
  areaWeight: number;
  topicSlug: string;
  topicName: string;
  attempted: number;
  keyedAttempted: number;
  accuracy: number | null;
  avgSeconds: number | null;
  lastSeenAt: string | null;
  nextDueAt: string | null;
  dueLabel: string;
  overdue: boolean;
  priorityScore: number;
  mode: AdaptiveMode;
  reasons: string[];
};

export type AdaptivePlanItem = {
  id: string;
  areaKey: AreaKey;
  topicSlug: string;
  topicName: string;
  mode: AdaptiveMode;
  minutes: number;
  priorityScore: number;
  reason: string;
  status: "queued" | "done";
};

export type AdaptivePlan = {
  id: string;
  createdAt: string;
  targetMinutes: number;
  totalMinutes: number;
  items: AdaptivePlanItem[];
  evidence: { submittedAttempts: number; answeredQuestions: number };
};

type TopicEvidence = { answered: number; keyed: number; correct: number; seconds: number; lastSeenAt: string | null };

function readStates(): Record<string, AdaptiveReviewState> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; }
}
function writeStates(states: Record<string, AdaptiveReviewState>) { localStorage.setItem(STATE_KEY, JSON.stringify(states)); }
function key(areaKey: AreaKey, topicSlug: string) { return `${areaKey}:${topicSlug}`; }
function clamp(n: number, min = 0, max = 100) { return Math.max(min, Math.min(max, n)); }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(iso: string, days: number) { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString(); }
function daysUntilIso(iso: string) { return Math.ceil((startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / 86_400_000); }

function evidenceByTopic() {
  const out = new Map<string, TopicEvidence>();
  for (const attempt of listSubmittedAttempts()) {
    const exam = getExam(attempt.examId);
    if (!exam) continue;
    const when = attempt.submittedAt || attempt.startedAt;
    for (const q of exam.questions) {
      if (!q.areaKey || !q.topicSlug || !attempt.answers[q.id]) continue;
      const k = key(q.areaKey, q.topicSlug);
      const ev = out.get(k) || { answered: 0, keyed: 0, correct: 0, seconds: 0, lastSeenAt: null };
      ev.answered += 1;
      ev.seconds += attempt.questionTimesSec?.[q.id] || 0;
      if (q.correctKey) {
        ev.keyed += 1;
        if (attempt.answers[q.id] === q.correctKey) ev.correct += 1;
      }
      if (!ev.lastSeenAt || new Date(when).getTime() > new Date(ev.lastSeenAt).getTime()) ev.lastSeenAt = when;
      out.set(k, ev);
    }
  }
  return out;
}

function inferredInterval(accuracy: number | null, keyedAttempted: number) {
  if (!keyedAttempted || accuracy === null) return 1;
  if (accuracy < 55) return 1;
  if (accuracy < 70) return 2;
  if (accuracy < 85) return 4;
  return 7;
}

function modeFor(accuracy: number | null, avgSeconds: number | null, overdue: boolean, keyedAttempted: number): AdaptiveMode {
  if (!keyedAttempted || accuracy === null) return "baseline";
  if (accuracy < 60) return "remediation";
  if (accuracy < 80) return "targeted-practice";
  if ((avgSeconds || 0) > 120) return "speed-drill";
  if (overdue) return "spaced-review";
  return "mixed";
}

export function getAdaptivePriorities(): AdaptivePriority[] {
  const setup = loadSetup();
  const states = readStates();
  const evidence = evidenceByTopic();
  const priorities: AdaptivePriority[] = [];
  for (const area of areas) {
    for (const topic of area.topics) {
      const k = key(area.key, topic.slug);
      const ev = evidence.get(k);
      const attempted = ev?.answered || 0;
      const keyedAttempted = ev?.keyed || 0;
      const accuracy = keyedAttempted ? Math.round((ev!.correct / keyedAttempted) * 100) : null;
      const avgSeconds = attempted ? Math.round((ev?.seconds || 0) / attempted) : null;
      const lastSeenAt = ev?.lastSeenAt || null;
      const saved = states[k];
      const inferredDue = lastSeenAt ? addDays(lastSeenAt, inferredInterval(accuracy, keyedAttempted)) : new Date().toISOString();
      const nextDueAt = saved?.nextDueAt || inferredDue;
      const dueDays = daysUntilIso(nextDueAt);
      const overdue = dueDays <= 0;
      const weakness = accuracy === null ? 35 : 100 - accuracy;
      const pacePenalty = avgSeconds === null ? 0 : clamp(((avgSeconds - 70) / 100) * 100);
      const dueBoost = dueDays <= 0 ? 100 : dueDays <= 2 ? 60 : dueDays <= 5 ? 25 : 0;
      const coverageGap = attempted === 0 ? 80 : 0;
      const confidenceBoost = attempted === 0 && setup.confidence?.[area.key] === "needs-work" ? 20 : 0;
      const weightFactor = area.weight / 35;
      const raw = weakness * .52 + pacePenalty * .13 + dueBoost * .20 + coverageGap * .10 + confidenceBoost * .05;
      const priorityScore = Math.round(clamp(raw * weightFactor));
      const reasons: string[] = [];
      if (accuracy !== null && accuracy < 70) reasons.push(`${accuracy}% keyed accuracy needs repair`);
      else if (accuracy !== null && accuracy < 85) reasons.push(`${accuracy}% keyed accuracy can be tightened`);
      if (avgSeconds !== null && avgSeconds > 120) reasons.push(`${avgSeconds}s average pace is slow`);
      if (attempted === 0) reasons.push("not yet measured in exam history");
      else if (keyedAttempted === 0) reasons.push("answered, but no trusted key yet");
      if (overdue && attempted > 0) reasons.push("due for spaced review");
      if (!reasons.length) reasons.push("keep this topic active before it fades");
      priorities.push({
        areaKey: area.key,
        areaShort: area.short,
        areaWeight: area.weight,
        topicSlug: topic.slug,
        topicName: topic.name,
        attempted,
        keyedAttempted,
        accuracy,
        avgSeconds,
        lastSeenAt,
        nextDueAt,
        dueLabel: dueDays < 0 ? `${Math.abs(dueDays)}d overdue` : dueDays === 0 ? "due today" : `due in ${dueDays}d`,
        overdue,
        priorityScore,
        mode: modeFor(accuracy, avgSeconds, overdue, keyedAttempted),
        reasons,
      });
    }
  }
  return priorities.sort((a,b)=>b.priorityScore-a.priorityScore || b.areaWeight-a.areaWeight || a.topicName.localeCompare(b.topicName));
}

function minutesFor(mode: AdaptiveMode) {
  if (mode === "remediation") return 18;
  if (mode === "targeted-practice") return 15;
  if (mode === "speed-drill") return 12;
  if (mode === "baseline") return 12;
  return 10;
}

export function buildAdaptivePlan(targetMinutes = loadSetup().dailyTargetMinutes || 60): AdaptivePlan {
  const priorities = getAdaptivePriorities();
  const items: AdaptivePlanItem[] = [];
  let total = 0;
  for (const p of priorities) {
    if (items.length >= 4) break;
    const minutes = minutesFor(p.mode);
    if (items.length >= 2 && total + minutes > targetMinutes + 8) continue;
    items.push({ id: crypto.randomUUID(), areaKey: p.areaKey, topicSlug: p.topicSlug, topicName: p.topicName, mode: p.mode, minutes, priorityScore: p.priorityScore, reason: p.reasons[0], status: "queued" });
    total += minutes;
  }
  const progress = getProgressSnapshot();
  const plan: AdaptivePlan = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), targetMinutes, totalMinutes: total, items, evidence: { submittedAttempts: progress.attempts, answeredQuestions: progress.answered } };
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  return plan;
}

export function loadAdaptivePlan(): AdaptivePlan | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(PLAN_KEY) || "null"); } catch { return null; }
}
export function markAdaptiveItemDone(itemId: string) {
  const plan = loadAdaptivePlan();
  if (!plan) return null;
  plan.items = plan.items.map(item => item.id === itemId ? { ...item, status: "done" } : item);
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  return plan;
}
export function markTopicReviewed(areaKey: AreaKey, topicSlug: string, rating: ReviewRating) {
  const states = readStates();
  const k = key(areaKey, topicSlug);
  const previous = states[k];
  const base = previous?.intervalDays || 1;
  const intervalDays = rating === "hard" ? 1 : rating === "okay" ? Math.max(2, Math.round(base * 1.8)) : Math.max(4, Math.round(base * 2.6));
  const now = new Date().toISOString();
  states[k] = { areaKey, topicSlug, lastReviewedAt: now, nextDueAt: addDays(now, intervalDays), intervalDays, reviewCount: (previous?.reviewCount || 0) + 1, lastRating: rating };
  writeStates(states);
  return states[k];
}
export function adaptiveContext(priority: AdaptivePriority) {
  const topic = getTopic(priority.areaKey, priority.topicSlug);
  return `CELE area: ${priority.areaShort} (${priority.areaWeight}% weight)\nTopic: ${topic?.name || priority.topicName}\nQuestions answered: ${priority.attempted}\nKeyed questions: ${priority.keyedAttempted}\nAccuracy: ${priority.accuracy === null ? "not measured" : `${priority.accuracy}%`}\nAverage time/question: ${priority.avgSeconds === null ? "not measured" : `${priority.avgSeconds}s`}\nReview status: ${priority.dueLabel}\nAdaptive priority score: ${priority.priorityScore}/100\nRecommended mode: ${priority.mode}\nReasons: ${priority.reasons.join("; ")}`;
}
