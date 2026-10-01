import { areas, getArea, getTopic, type AreaKey } from "./curriculum";
import { getExam, listSubmittedAttempts } from "./exam-store";
import type { ExamAttempt, ExamQuestion } from "./exam-types";

export type Metric = {
  attempted: number;
  keyedAttempted: number;
  correct: number;
  incorrect: number;
  seconds: number;
  accuracy: number;
  avgSeconds: number;
};

export type TopicProgress = {
  areaKey: AreaKey;
  topicSlug: string;
  name: string;
  metric: Metric;
  lastSeenAt: string | null;
};

export type MistakeItem = {
  attemptId: string;
  examId: string;
  examTitle: string;
  submittedAt: string;
  questionId: string;
  questionNumber: number;
  prompt: string;
  choices: ExamQuestion["choices"];
  selected: string | null;
  correctKey: string;
  seconds: number;
  areaKey?: AreaKey;
  topicSlug?: string;
  topicName?: string;
};

export type MistakeTopic = {
  areaKey?: AreaKey;
  topicSlug?: string;
  topicName: string;
  misses: number;
  latestAt: string;
};

export type SimulationHistoryItem = {
  attempt: ExamAttempt;
  title: string;
  score: number | null;
  answered: number;
  total: number;
  durationSeconds: number;
  standard: string;
  blockLabel: string;
};

export type StudyHistoryItem = {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  score: number | null;
  href: string;
};

export type ProgressSnapshot = {
  attempts: number;
  avgScore: number | null;
  bestScore: number | null;
  answered: number;
  totalSeconds: number;
  activeQuestionSeconds: number;
  avgSecondsPerQuestion: number | null;
  trend: { label: string; score: number | null; attemptId: string; examId: string }[];
  areas: { key: AreaKey; short: string; name: string; weight: number; metric: Metric }[];
  topics: TopicProgress[];
  recent: { attempt: ExamAttempt; title: string; score: number | null; answered: number; total: number }[];
  activeDays: number;
  streak: number;
  last30: {
    attempts: number;
    answered: number;
    keyedAttempted: number;
    correct: number;
    accuracy: number | null;
    activeQuestionSeconds: number;
    activeDays: number;
  };
  timing: {
    thresholdSeconds: number;
    fastCorrect: number;
    slowCorrect: number;
    fastIncorrect: number;
    slowIncorrect: number;
  };
  mistakes: {
    total: number;
    recent: MistakeItem[];
    topics: MistakeTopic[];
  };
  simulations: SimulationHistoryItem[];
  history: StudyHistoryItem[];
};

function empty(): Metric {
  return { attempted: 0, keyedAttempted: 0, correct: 0, incorrect: 0, seconds: 0, accuracy: 0, avgSeconds: 0 };
}

function finish(metric: Metric) {
  metric.incorrect = Math.max(0, metric.keyedAttempted - metric.correct);
  metric.accuracy = metric.keyedAttempted ? Math.round((metric.correct / metric.keyedAttempted) * 100) : 0;
  metric.avgSeconds = metric.attempted ? Math.round(metric.seconds / metric.attempted) : 0;
  return metric;
}

export function scoreAttempt(attempt: ExamAttempt) {
  const exam = getExam(attempt.examId);
  if (!exam) return { score: null, correct: 0, keyed: 0, answered: 0, total: 0 };
  const keyed = exam.questions.filter((question) => question.correctKey);
  const correct = keyed.filter((question) => attempt.answers[question.id] === question.correctKey).length;
  const answered = exam.questions.filter((question) => attempt.answers[question.id]).length;
  return {
    score: keyed.length ? Math.round((correct / keyed.length) * 100) : null,
    correct,
    keyed: keyed.length,
    answered,
    total: exam.questions.length,
  };
}

function dayKey(value: string) {
  return value.slice(0, 10);
}

function elapsedSeconds(attempt: ExamAttempt) {
  if (!attempt.submittedAt) return 0;
  return Math.max(0, Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000));
}

function questionSeconds(attempt: ExamAttempt, questionId: string) {
  return Math.max(0, attempt.questionTimesSec?.[questionId] || 0);
}

export function getProgressSnapshot(): ProgressSnapshot {
  const attempts = listSubmittedAttempts();
  const areaMap = new Map<AreaKey, Metric>(areas.map((area) => [area.key, empty()]));
  const topicMap = new Map<string, TopicProgress>();
  const scores: number[] = [];
  const trend: ProgressSnapshot["trend"] = [];
  const recent: ProgressSnapshot["recent"] = [];
  const mistakes: MistakeItem[] = [];
  const mistakeTopicMap = new Map<string, MistakeTopic>();
  const simulations: SimulationHistoryItem[] = [];
  const history: StudyHistoryItem[] = [];
  const last30Cutoff = Date.now() - 30 * 86_400_000;
  const last30DayKeys = new Set<string>();
  const last30 = { attempts: 0, answered: 0, keyedAttempted: 0, correct: 0, accuracy: null as number | null, activeQuestionSeconds: 0, activeDays: 0 };
  const timing = { thresholdSeconds: 120, fastCorrect: 0, slowCorrect: 0, fastIncorrect: 0, slowIncorrect: 0 };

  let answered = 0;
  let totalSeconds = 0;
  let activeQuestionSeconds = 0;

  for (const attempt of attempts) {
    const exam = getExam(attempt.examId);
    if (!exam) continue;
    const score = scoreAttempt(attempt);
    const when = attempt.submittedAt || attempt.startedAt;
    const submittedMs = new Date(when).getTime();
    const isLast30 = submittedMs >= last30Cutoff;
    const sessionSeconds = elapsedSeconds(attempt);

    if (score.score !== null) scores.push(score.score);
    answered += score.answered;
    totalSeconds += sessionSeconds;
    trend.push({
      label: new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(when)),
      score: score.score,
      attemptId: attempt.id,
      examId: attempt.examId,
    });
    recent.push({ attempt, title: exam.title, score: score.score, answered: score.answered, total: score.total });
    history.push({
      id: attempt.id,
      date: when,
      title: exam.title,
      subtitle: `${attempt.mode === "simulation" ? "Simulation" : "Practice"} · ${score.answered}/${score.total} answered · ${Math.max(1, Math.round(sessionSeconds / 60))} min`,
      score: score.score,
      href: `/practice/${attempt.examId}/results`,
    });

    if (isLast30) {
      last30.attempts += 1;
      last30.answered += score.answered;
      last30DayKeys.add(dayKey(when));
    }

    if (attempt.mode === "simulation") {
      const block = attempt.prcBlock ? getArea(attempt.prcBlock) : undefined;
      simulations.push({
        attempt,
        title: exam.title,
        score: score.score,
        answered: score.answered,
        total: score.total,
        durationSeconds: sessionSeconds,
        standard: attempt.simulationStandard === "prc-2026" ? "PRC CELE format · effective March 2026" : "Custom timing",
        blockLabel: block?.short || attempt.prcBlock?.toUpperCase() || "Simulation",
      });
    }

    for (const question of exam.questions) {
      const selected = attempt.answers[question.id];
      if (!selected) continue;
      const seconds = questionSeconds(attempt, question.id);
      activeQuestionSeconds += seconds;
      if (isLast30) {
        last30.activeQuestionSeconds += seconds;
        last30.answered += 0;
      }

      if (question.areaKey) {
        const areaMetric = areaMap.get(question.areaKey)!;
        areaMetric.attempted += 1;
        areaMetric.seconds += seconds;
        if (question.correctKey) {
          areaMetric.keyedAttempted += 1;
          if (selected === question.correctKey) areaMetric.correct += 1;
        }
      }

      if (question.areaKey && question.topicSlug) {
        const topicKey = `${question.areaKey}:${question.topicSlug}`;
        if (!topicMap.has(topicKey)) {
          topicMap.set(topicKey, {
            areaKey: question.areaKey,
            topicSlug: question.topicSlug,
            name: getTopic(question.areaKey, question.topicSlug)?.name || question.topicSlug,
            metric: empty(),
            lastSeenAt: when,
          });
        }
        const topic = topicMap.get(topicKey)!;
        topic.metric.attempted += 1;
        topic.metric.seconds += seconds;
        if (question.correctKey) {
          topic.metric.keyedAttempted += 1;
          if (selected === question.correctKey) topic.metric.correct += 1;
        }
        if (!topic.lastSeenAt || new Date(when).getTime() > new Date(topic.lastSeenAt).getTime()) topic.lastSeenAt = when;
      }

      if (question.correctKey) {
        const correct = selected === question.correctKey;
        if (isLast30) {
          last30.keyedAttempted += 1;
          if (correct) last30.correct += 1;
        }
        if (seconds <= timing.thresholdSeconds) {
          if (correct) timing.fastCorrect += 1;
          else timing.fastIncorrect += 1;
        } else if (correct) timing.slowCorrect += 1;
        else timing.slowIncorrect += 1;

        if (!correct) {
          const topicName = question.areaKey && question.topicSlug ? getTopic(question.areaKey, question.topicSlug)?.name : undefined;
          const item: MistakeItem = {
            attemptId: attempt.id,
            examId: attempt.examId,
            examTitle: exam.title,
            submittedAt: when,
            questionId: question.id,
            questionNumber: question.number,
            prompt: question.prompt,
            choices: question.choices,
            selected,
            correctKey: question.correctKey,
            seconds,
            areaKey: question.areaKey,
            topicSlug: question.topicSlug,
            topicName,
          };
          mistakes.push(item);
          const mistakeKey = question.areaKey && question.topicSlug ? `${question.areaKey}:${question.topicSlug}` : "untagged";
          const existing = mistakeTopicMap.get(mistakeKey);
          if (existing) {
            existing.misses += 1;
            if (new Date(when).getTime() > new Date(existing.latestAt).getTime()) existing.latestAt = when;
          } else {
            mistakeTopicMap.set(mistakeKey, {
              areaKey: question.areaKey,
              topicSlug: question.topicSlug,
              topicName: topicName || "Untagged questions",
              misses: 1,
              latestAt: when,
            });
          }
        }
      }
    }
  }

  const uniqueDays = [...new Set(attempts.map((attempt) => dayKey(attempt.submittedAt || attempt.startedAt)))].sort();
  let streak = 0;
  if (uniqueDays.length) {
    let cursor = new Date(`${uniqueDays[uniqueDays.length - 1]}T00:00:00`);
    for (let index = uniqueDays.length - 1; index >= 0; index -= 1) {
      const date = new Date(`${uniqueDays[index]}T00:00:00`);
      const diff = Math.round((cursor.getTime() - date.getTime()) / 86_400_000);
      if (diff === 0) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 86_400_000);
      } else if (diff > 0) break;
    }
  }

  last30.activeDays = last30DayKeys.size;
  last30.accuracy = last30.keyedAttempted ? Math.round((last30.correct / last30.keyedAttempted) * 100) : null;

  return {
    attempts: attempts.length,
    avgScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    bestScore: scores.length ? Math.max(...scores) : null,
    answered,
    totalSeconds,
    activeQuestionSeconds,
    avgSecondsPerQuestion: answered ? Math.round(activeQuestionSeconds / answered) : null,
    trend,
    areas: areas.map((area) => ({ key: area.key, short: area.short, name: area.name, weight: area.weight, metric: finish(areaMap.get(area.key)!) })),
    topics: [...topicMap.values()].map((topic) => ({ ...topic, metric: finish(topic.metric) })).sort((a, b) => {
      if (a.metric.keyedAttempted === 0 && b.metric.keyedAttempted > 0) return 1;
      if (b.metric.keyedAttempted === 0 && a.metric.keyedAttempted > 0) return -1;
      return a.metric.accuracy - b.metric.accuracy || b.metric.keyedAttempted - a.metric.keyedAttempted;
    }),
    recent: recent.slice(-6).reverse(),
    activeDays: uniqueDays.length,
    streak,
    last30,
    timing,
    mistakes: {
      total: mistakes.length,
      recent: mistakes.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 20),
      topics: [...mistakeTopicMap.values()].sort((a, b) => b.misses - a.misses || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()),
    },
    simulations: simulations.sort((a, b) => new Date(b.attempt.submittedAt || b.attempt.startedAt).getTime() - new Date(a.attempt.submittedAt || a.attempt.startedAt).getTime()),
    history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}

export function getTopicProgress(areaKey: AreaKey, topicSlug: string) {
  const snapshot = getProgressSnapshot();
  const topic = snapshot.topics.find((item) => item.areaKey === areaKey && item.topicSlug === topicSlug);
  const mistakes = snapshot.mistakes.recent.filter((item) => item.areaKey === areaKey && item.topicSlug === topicSlug);
  const attempts = listSubmittedAttempts().flatMap((attempt) => {
    const exam = getExam(attempt.examId);
    if (!exam) return [];
    const matching = exam.questions.filter((question) => question.areaKey === areaKey && question.topicSlug === topicSlug && attempt.answers[question.id]);
    if (!matching.length) return [];
    const keyed = matching.filter((question) => question.correctKey);
    const correct = keyed.filter((question) => attempt.answers[question.id] === question.correctKey).length;
    const seconds = matching.reduce((sum, question) => sum + questionSeconds(attempt, question.id), 0);
    return [{
      attemptId: attempt.id,
      examId: attempt.examId,
      title: exam.title,
      date: attempt.submittedAt || attempt.startedAt,
      attempted: matching.length,
      keyed: keyed.length,
      accuracy: keyed.length ? Math.round((correct / keyed.length) * 100) : null,
      avgSeconds: matching.length ? Math.round(seconds / matching.length) : 0,
    }];
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { topic, mistakes, attempts };
}

export type TomorrowPlan = {
  createdAt: string;
  totalMinutes: number;
  items: { areaKey: AreaKey; topicSlug?: string; title: string; minutes: number; reason: string }[];
};

const PLAN = "kih:tomorrow-plan:v2";

export function buildTomorrowPlan(): TomorrowPlan {
  const progress = getProgressSnapshot();
  const items: TomorrowPlan["items"] = [];
  const evidenceTopics = progress.topics
    .filter((topic) => topic.metric.keyedAttempted >= 3)
    .sort((a, b) => a.metric.accuracy - b.metric.accuracy || b.metric.keyedAttempted - a.metric.keyedAttempted)
    .slice(0, 2);

  for (const topic of evidenceTopics) {
    items.push({
      areaKey: topic.areaKey,
      topicSlug: topic.topicSlug,
      title: topic.name,
      minutes: 10,
      reason: `${topic.metric.accuracy}% accuracy across ${topic.metric.keyedAttempted} keyed questions`,
    });
  }

  if (items.length < 2) {
    for (const area of progress.areas.filter((item) => item.metric.attempted > 0).sort((a, b) => a.metric.accuracy - b.metric.accuracy)) {
      if (items.some((item) => item.areaKey === area.key)) continue;
      items.push({ areaKey: area.key, title: `${area.short} refresh`, minutes: 10, reason: `${area.metric.keyedAttempted || area.metric.attempted} questions of evidence` });
      if (items.length === 2) break;
    }
  }

  if (!items.length) {
    items.push({ areaKey: "structural", topicSlug: "engineering-mechanics", title: "Engineering Mechanics", minutes: 12, reason: "Start with a short baseline review" });
  }

  if (progress.mistakes.total > 0) {
    items.push({ areaKey: items[0].areaKey, title: "Mistake replay", minutes: 8, reason: `Retry ${Math.min(5, progress.mistakes.total)} recent misses without looking at the key` });
  }

  const plan = { createdAt: new Date().toISOString(), totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0), items };
  if (typeof window !== "undefined") localStorage.setItem(PLAN, JSON.stringify(plan));
  return plan;
}

export function loadTomorrowPlan(): TomorrowPlan | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(PLAN) || "null"); }
  catch { return null; }
}
