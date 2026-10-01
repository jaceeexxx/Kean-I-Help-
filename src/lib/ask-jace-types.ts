import type { AreaKey } from "./curriculum";

export type AskJaceAction =
  | "freeform"
  | "explain"
  | "hint"
  | "simplify"
  | "step_by_step"
  | "similar_problem"
  | "quiz"
  | "why_wrong"
  | "study_next"
  | "material_study"
  | "adaptive_practice"
  | "remediation"
  | "source_practice";

export type AskJaceContextKind = "lesson" | "exam-question" | "material" | "topic" | "progress";

export type AskJaceContext = {
  kind: AskJaceContextKind;
  label: string;
  text: string;
  sourceId?: string;
  sourceTitle?: string;
  areaKey?: AreaKey;
  topicSlug?: string;
};

export type AskJaceHistoryMessage = { role: "user" | "assistant"; content: string };

export type AskJaceRequest = {
  message: string;
  action?: AskJaceAction;
  context?: AskJaceContext | null;
  history?: AskJaceHistoryMessage[];
};

export type AskJaceResponse = {
  answer: string;
  model: string;
  grounded: boolean;
  sources: Array<{ id?: string; title: string }>;
};
