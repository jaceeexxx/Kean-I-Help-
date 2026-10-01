import { listExams, saveExam } from "./exam-store";
import type { AreaKey } from "./curriculum";
import type { StructuredExam } from "./exam-types";

function shuffled<T>(items: T[]) {
  return items
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export function buildQuickPractice(count = 10): StructuredExam | null {
  const source = listExams();
  const pool = source.flatMap((exam) => exam.questions);
  if (!pool.length) return null;
  const questions = shuffled(pool).slice(0, Math.min(count, pool.length)).map((q, index) => ({
    ...q,
    id: crypto.randomUUID(),
    number: index + 1,
  }));
  const exam: StructuredExam = {
    id: crypto.randomUUID(),
    libraryId: "derived:quick-practice",
    title: "Quick Practice",
    practiceLabel: `${questions.length} mixed questions`,
    durationMinutes: Math.max(10, questions.length * 2),
    questions,
    createdAt: new Date().toISOString(),
  };
  saveExam(exam);
  return exam;
}

export function buildTargetedPractice(areaKey: AreaKey, topicSlug?: string, count = 10): StructuredExam | null {
  const source = listExams();
  const pool = source
    .flatMap((exam) => exam.questions)
    .filter((question) => question.areaKey === areaKey && (!topicSlug || question.topicSlug === topicSlug));
  if (!pool.length) return null;
  const questions = shuffled(pool).slice(0, Math.min(count, pool.length)).map((q, index) => ({
    ...q,
    id: crypto.randomUUID(),
    number: index + 1,
  }));
  const exam: StructuredExam = {
    id: crypto.randomUUID(),
    libraryId: "derived:targeted-practice",
    title: "Targeted Practice",
    practiceLabel: topicSlug || areaKey,
    durationMinutes: Math.max(10, questions.length * 2),
    questions,
    createdAt: new Date().toISOString(),
  };
  saveExam(exam);
  return exam;
}
