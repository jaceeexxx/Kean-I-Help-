import type { AreaKey } from "./curriculum";

export type Choice = { key: string; text: string };

export type ExamQuestion = {
  id: string;
  number: number;
  prompt: string;
  choices: Choice[];
  correctKey?: string;
  explanation?: string;
  sourcePage?: number;
  confidence: number;
  needsReview: boolean;
  areaKey?: AreaKey;
  topicSlug?: string;
};

export type StructuredExam = {
  id: string;
  libraryId: string;
  title: string;
  durationMinutes: number;
  questions: ExamQuestion[];
  createdAt: string;
  verifiedAt?: string;
  derivedFromExamId?: string;
  practiceLabel?: string;
};

export type ExamMode = "practice" | "simulation";
export type SimulationStandard = "custom" | "prc-2026";
export type PRCBlockKey = "structural" | "mste" | "hge";

export type ExamAttempt = {
  id: string;
  examId: string;
  mode: ExamMode;
  startedAt: string;
  expiresAt?: string;
  submittedAt?: string;
  answers: Record<string, string>;
  flagged: string[];
  currentIndex: number;
  durationMinutes: number;
  questionTimesSec: Record<string, number>;
  lastQuestionEnteredAt?: string;
  simulationStandard?: SimulationStandard;
  prcBlock?: PRCBlockKey;
  guidelineVersion?: string;
  autoSubmitted?: boolean;
};
