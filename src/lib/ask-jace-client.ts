import type { AskJaceAction, AskJaceContext, AskJaceRequest, AskJaceResponse } from "./ask-jace-types";

export const ASK_JACE_OPEN_EVENT = "askjace:open";

export type AskJaceOpenDetail = {
  context?: AskJaceContext;
  action?: AskJaceAction;
  message?: string;
};

export function openAskJace(detail: AskJaceOpenDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AskJaceOpenDetail>(ASK_JACE_OPEN_EVENT, { detail }));
}

export async function askJace(request: AskJaceRequest): Promise<AskJaceResponse> {
  const response = await fetch("/api/ask-jace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Ask Jace could not answer right now.");
  return data as AskJaceResponse;
}
