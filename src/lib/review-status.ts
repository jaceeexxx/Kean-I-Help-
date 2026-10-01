import type { Metric } from "./progress";

export type TopicStatus = "Not started" | "Developing" | "Needs work" | "Strong";

export function getTopicStatus(metric?: Metric): TopicStatus {
  if (!metric || metric.attempted === 0) return "Not started";
  if (metric.keyedAttempted === 0 || metric.keyedAttempted < 8) return "Developing";
  if (metric.accuracy < 65) return "Needs work";
  if (metric.keyedAttempted >= 10 && metric.accuracy >= 85) return "Strong";
  return "Developing";
}

export function statusTone(status: TopicStatus) {
  if (status === "Strong") return "strong";
  if (status === "Needs work") return "needs";
  if (status === "Developing") return "developing";
  return "new";
}
