export const KEY = "kih:onboarding:v2";

export type Confidence = "needs-work" | "okay" | "confident";

export type Setup = {
  targetExamPeriod: string;
  targetExamDate: string;
  dailyTargetMinutes: number;
  studyDays: number[];
  restDays: number[];
  confidence: {
    structural: Confidence;
    mste: Confidence;
    hge: Confidence;
  };
  reminderEnabled: boolean;
  reminderTime: string;
  firstMessageSeen: boolean;
  completed: boolean;
};

export const defaults: Setup = {
  targetExamPeriod: "April 2027",
  targetExamDate: "",
  dailyTargetMinutes: 60,
  studyDays: [1, 2, 3, 4, 5, 6],
  restDays: [0],
  confidence: { structural: "okay", mste: "okay", hge: "okay" },
  reminderEnabled: true,
  reminderTime: "19:00",
  firstMessageSeen: false,
  completed: false,
};

export const loadSetup = (): Setup => {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaults;
  }
};

export const saveSetup = (value: Setup) => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(value));
};

export function daysUntil(value: string) {
  if (!value) return null;
  const target = new Date(`${value}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}
