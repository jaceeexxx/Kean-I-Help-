import { askJace } from "./ask-jace-client";
import { saveAiReviewItem } from "./ai-review-store";
import { adaptiveContext, type AdaptivePriority } from "./adaptive";

export async function generateTargetedPractice(priority: AdaptivePriority) {
  const result = await askJace({
    action: "adaptive_practice",
    context: { kind: "topic", label: priority.topicName, text: adaptiveContext(priority), areaKey: priority.areaKey, topicSlug: priority.topicSlug },
    message: `Create a targeted CELE practice set for ${priority.topicName}. Match the difficulty to the supplied performance evidence. Do not repeat exact previous questions.`,
  });
  const item = saveAiReviewItem({ kind: "adaptive-practice", title: `Targeted Practice · ${priority.topicName}`, content: result.answer, areaKey: priority.areaKey, topicSlug: priority.topicSlug });
  return { result, item };
}

export async function generateRemediation(priority: AdaptivePriority, extra = "") {
  const result = await askJace({
    action: "remediation",
    context: { kind: "topic", label: priority.topicName, text: `${adaptiveContext(priority)}${extra ? `\n\nRecent mistake evidence:\n${extra}` : ""}`, areaKey: priority.areaKey, topicSlug: priority.topicSlug },
    message: `Build a short repair session for ${priority.topicName}: diagnose the likely misconception from the evidence, reteach only what is needed, then give two check questions.`,
  });
  const item = saveAiReviewItem({ kind: "remediation", title: `Remediation · ${priority.topicName}`, content: result.answer, areaKey: priority.areaKey, topicSlug: priority.topicSlug });
  return { result, item };
}
