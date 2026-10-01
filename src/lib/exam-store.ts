import type { ExamAttempt, StructuredExam } from "./exam-types";
import { createExpiry } from "./simulation/clock";

const EK = "kih:exams:v1";
const AK = "kih:attempts:v1";
const HK = "kih:attempt-history:v2";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeAttempt(attempt: ExamAttempt | null): ExamAttempt | null {
  if (!attempt) return null;
  if (attempt.mode === "simulation" && !attempt.expiresAt) {
    return {
      ...attempt,
      expiresAt: createExpiry(attempt.startedAt, attempt.durationMinutes),
      simulationStandard: attempt.simulationStandard || "custom",
    };
  }
  return attempt;
}

export const listExams = () => Object.values(read<Record<string, StructuredExam>>(EK, {}));
export const getExam = (id: string) => read<Record<string, StructuredExam>>(EK, {})[id] || null;

export function saveExam(exam: StructuredExam) {
  const all = read<Record<string, StructuredExam>>(EK, {});
  all[exam.id] = exam;
  localStorage.setItem(EK, JSON.stringify(all));
}

export function getAttempt(id: string) {
  return normalizeAttempt(read<Record<string, ExamAttempt>>(AK, {})[id] || null);
}

export function saveAttempt(attempt: ExamAttempt) {
  const all = read<Record<string, ExamAttempt>>(AK, {});
  all[attempt.examId] = attempt;
  localStorage.setItem(AK, JSON.stringify(all));
}

export function clearAttempt(id: string) {
  const all = read<Record<string, ExamAttempt>>(AK, {});
  delete all[id];
  localStorage.setItem(AK, JSON.stringify(all));
}

export function recordSubmittedAttempt(attempt: ExamAttempt) {
  const all = read<ExamAttempt[]>(HK, []);
  if (!all.some((item) => item.id === attempt.id)) {
    all.push(attempt);
    localStorage.setItem(HK, JSON.stringify(all));
  }
  saveAttempt(attempt);
}

export function listSubmittedAttempts() {
  const history = read<ExamAttempt[]>(HK, []).map((attempt) => normalizeAttempt(attempt)!).filter(Boolean);
  const latest = Object.values(read<Record<string, ExamAttempt>>(AK, {}))
    .map((attempt) => normalizeAttempt(attempt)!)
    .filter((attempt) => Boolean(attempt?.submittedAt));
  for (const attempt of latest) {
    if (!history.some((item) => item.id === attempt.id)) history.push(attempt);
  }
  return history.sort(
    (a, b) =>
      new Date(a.submittedAt || a.startedAt).getTime() -
      new Date(b.submittedAt || b.startedAt).getTime(),
  );
}
