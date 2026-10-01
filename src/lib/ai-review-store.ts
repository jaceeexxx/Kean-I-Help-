import type { AreaKey } from "./curriculum";

const KEY = "kih:ai-review-items:v1";

export type AiReviewItem = {
  id: string;
  kind: "ask-jace" | "material-study" | "similar-problem" | "quiz" | "adaptive-practice" | "remediation" | "source-practice";
  title: string;
  content: string;
  sourceId?: string;
  sourceTitle?: string;
  areaKey?: AreaKey;
  topicSlug?: string;
  createdAt: string;
};

function read(): AiReviewItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function listAiReviewItems() { return read().sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }

export function saveAiReviewItem(item: Omit<AiReviewItem, "id" | "createdAt">) {
  const next: AiReviewItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify([next, ...read()].slice(0, 100)));
  return next;
}

export function removeAiReviewItem(id: string) {
  localStorage.setItem(KEY, JSON.stringify(read().filter(item => item.id !== id)));
}
