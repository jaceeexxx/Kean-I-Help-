"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { askJace } from "@/lib/ask-jace-client";
import type { AskJaceAction, AskJaceContext } from "@/lib/ask-jace-types";
import {
  appendJaceConversationMessage,
  createJaceConversation,
  getLocalJaceConversation,
  refreshJaceConversationsFromCloud,
  updateJaceConversation,
  type JaceConversation,
  type JaceConversationMessage,
} from "@/lib/jace-conversations";
import { saveAiReviewItem } from "@/lib/ai-review-store";
import { addNote, getLibraryFile, listLibrary } from "@/lib/library-service";
import { extractMaterialText, materialContext } from "@/lib/material-context";
import type { LibraryItem } from "@/lib/library-types";
import { areas } from "@/lib/curriculum";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { JaceRichText } from "./jace-rich-text";
import styles from "./jace-chat-core.module.css";

const actionOptions: Array<{ label: string; action: AskJaceAction; prompt: string }> = [
  { label: "Explain something", action: "explain", prompt: "Explain this clearly for CELE, starting with the core idea." },
  { label: "Help me solve", action: "step_by_step", prompt: "Help me solve this step-by-step. Show the setup and units clearly." },
  { label: "Quiz me", action: "quiz", prompt: "Quiz me on this context. One short set, CELE-style." },
  { label: "Review my mistakes", action: "why_wrong", prompt: "Help me understand the mistake in this context and what clue I should notice next time." },
];

const followups = [
  ["Simpler", "simplify" as AskJaceAction, "Explain that again in a simpler way without losing the important engineering detail."],
  ["Step-by-step", "step_by_step" as AskJaceAction, "Walk me through that step-by-step, including the governing equation, substitution, units, and check."],
  ["Another example", "similar_problem" as AskJaceAction, "Give me one similar CELE-style example with changed values, then explain the solution."],
  ["Quiz me", "quiz" as AskJaceAction, "Quiz me briefly on what we just discussed."],
] as const;

type Props = {
  conversationId?: string | null;
  initialContext?: AskJaceContext | null;
  initialMessage?: string;
  initialAction?: AskJaceAction;
  compact?: boolean;
  autoFocus?: boolean;
  onConversationCreated?: (id: string) => void;
  onClose?: () => void;
};

export function JaceChatCore({ conversationId, initialContext = null, initialMessage = "", initialAction = "freeform", compact = false, autoFocus = false, onConversationCreated, onClose }: Props) {
  const [threadId, setThreadId] = useState<string | null>(conversationId || null);
  const [conversation, setConversation] = useState<JaceConversation | null>(() => conversationId ? getLocalJaceConversation(conversationId) : null);
  const [context, setContext] = useState<AskJaceContext | null>(conversation?.context || initialContext);
  const [input, setInput] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<AskJaceAction>(initialAction);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(false);
  const [materials, setMaterials] = useState<LibraryItem[]>([]);
  const [attaching, setAttaching] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    setThreadId(conversationId || null);
    const next = conversationId ? getLocalJaceConversation(conversationId) : null;
    setConversation(next);
    if (next?.context !== undefined) setContext(next.context || null);
    if (conversationId && !next) {
      refreshJaceConversationsFromCloud().then(() => {
        if (!live) return;
        const restored = getLocalJaceConversation(conversationId);
        setConversation(restored);
        if (restored?.context !== undefined) setContext(restored.context || null);
      }).catch(() => {});
    }
    return () => { live = false; };
  }, [conversationId]);

  useEffect(() => {
    if (initialContext && !conversationId) setContext(initialContext);
  }, [initialContext, conversationId]);

  useEffect(() => {
    if (initialMessage && !conversationId) setInput(initialMessage);
    if (!conversationId) setPendingAction(initialAction);
  }, [initialMessage, initialAction, conversationId]);

  useEffect(() => {
    if (!picker) return;
    listLibrary().then(setMaterials).catch(() => setMaterials([]));
  }, [picker]);

  useEffect(() => {
    if (autoFocus) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [autoFocus]);

  useEffect(() => {
    window.setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  }, [conversation?.messages.length, busy]);

  const messages = conversation?.messages || [];
  const previous = useMemo(() => messages.slice(-10).map(item => ({ role: item.role, content: item.content })), [messages]);

  async function ensureThread(prompt: string) {
    if (threadId) return threadId;
    const created = await createJaceConversation({ context, firstMessage: prompt });
    setThreadId(created.id);
    setConversation(created);
    onConversationCreated?.(created.id);
    return created.id;
  }

  async function send(override?: { action: AskJaceAction; prompt: string }) {
    const prompt = (override?.prompt || input).trim();
    if (!prompt || busy) return;
    const action = override?.action || pendingAction || "freeform";
    setInput("");
    setError("");
    setBusy(true);
    try {
      const id = await ensureThread(prompt);
      const withUser = await appendJaceConversationMessage(id, { role: "user", content: prompt, action });
      if (withUser) setConversation(withUser);
      const result = await askJace({ message: prompt, action, context, history: previous });
      const withAssistant = await appendJaceConversationMessage(id, {
        role: "assistant",
        content: result.answer,
        action,
        model: result.model,
        sources: result.sources,
      });
      if (withAssistant) setConversation(withAssistant);
      setPendingAction("freeform");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ask Jace could not answer right now.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseTopic(areaKey: "structural" | "mste" | "hge", topicSlug: string, label: string) {
    const area = areas.find(item => item.key === areaKey)!;
    const next: AskJaceContext = {
      kind: "topic",
      label,
      text: `CELE area: ${area.name}\nTopic: ${label}`,
      areaKey,
      topicSlug,
    };
    setContext(next);
    setPicker(false);
    if (threadId) {
      const updated = await updateJaceConversation(threadId, { context: next });
      if (updated) setConversation(updated);
    }
  }

  async function chooseMaterial(item: LibraryItem) {
    setAttaching(item.id);
    setError("");
    try {
      const file = await getLibraryFile(item.id);
      if (!file) throw new Error("This material could not be opened.");
      const text = await extractMaterialText(file.item, file.blob);
      const next = materialContext(file.item, text);
      setContext(next);
      setPicker(false);
      if (threadId) {
        const updated = await updateJaceConversation(threadId, { context: next });
        if (updated) setConversation(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "This material could not be attached.");
    } finally {
      setAttaching(null);
    }
  }

  async function detachContext() {
    setContext(null);
    if (threadId) {
      const updated = await updateJaceConversation(threadId, { context: null });
      if (updated) setConversation(updated);
    }
  }

  function saveAnswer(message: JaceConversationMessage) {
    saveAiReviewItem({
      kind: message.action === "similar_problem" ? "similar-problem" : message.action === "quiz" ? "quiz" : "ask-jace",
      title: context ? `Ask Jace · ${context.label}` : conversation?.title || "Ask Jace",
      content: message.content,
      sourceId: context?.sourceId,
      sourceTitle: context?.sourceTitle,
      areaKey: context?.areaKey,
      topicSlug: context?.topicSlug,
    });
  }

  async function saveAsNote(message: JaceConversationMessage) {
    const title = context ? `Jace · ${context.label}` : conversation?.title || "Jace note";
    await addNote(title, message.content, context?.areaKey, context?.topicSlug);
  }

  return <section className={`${styles.core} ${compact ? styles.compact : ""}`}>
    {!compact && <header className={styles.topbar}>
      <div className={styles.identity}><JaceSticker mood={busy ? "thinking" : "default"} size={54}/><div><small>YOUR CELE COMPANION</small><h1>Ask Jace</h1></div></div>
      {onClose && <button className={styles.close} onClick={onClose} aria-label="Close Ask Jace">×</button>}
    </header>}

    {context ? <div className={styles.context}>
      <div><small>CONTEXT</small><strong>{context.label}</strong><span>{context.kind.replaceAll("-", " ")}{context.sourceTitle && context.sourceTitle !== context.label ? ` · ${context.sourceTitle}` : ""}</span></div>
      <button onClick={detachContext}>Clear</button>
    </div> : null}

    {!messages.length && <div className={styles.welcome}>
      <JaceSticker mood="default" size={compact ? 88 : 108}/>
      <div><h2>{context ? "I'm already with you here." : "What are we figuring out?"}</h2><p>{context ? `I can use ${context.label} as context, so you don't need to explain where you are.` : "Ask about CELE concepts, formulas, problems, your materials, or what to study next."}</p></div>
      <div className={styles.quick}>{actionOptions.map(option => <button key={option.action} onClick={() => send(option)} disabled={busy || (option.action === "why_wrong" && !context)}>{option.label}</button>)}</div>
    </div>}

    <div className={styles.messages} aria-live="polite">
      {messages.map(message => message.role === "user" ? <article key={message.id} className={styles.userMessage}><span>Kean</span><div>{message.content}</div></article> : <article key={message.id} className={styles.jaceMessage}>
        <div className={styles.jaceHead}><img src="/assets/jace/mini/chat.png" alt=""/><span>Jace</span></div>
        <JaceRichText content={message.content}/>
        {message.sources?.length ? <div className={styles.sources}>{message.sources.map((source, index) => <span key={`${source.id || source.title}-${index}`}>Based on: {source.title}</span>)}</div> : <span className={styles.general}>General CE explanation</span>}
        <div className={styles.answerActions}><button onClick={() => saveAnswer(message)}>Save</button><button onClick={() => saveAsNote(message)}>Save as note</button></div>
        <div className={styles.followups}>{followups.map(([label, action, prompt]) => <button key={label} onClick={() => send({ action, prompt })} disabled={busy}>{label}</button>)}</div>
      </article>)}
      {busy && <article className={styles.jaceMessage}><div className={styles.jaceHead}><JaceSticker mood="thinking" size={38}/><span>Jace</span></div><p className={styles.thinking}>Working it out…</p></article>}
      <div ref={endRef}/>
    </div>

    {error && <div className={styles.error} role="alert">{error}</div>}

    <div className={styles.composerWrap}>
      {picker && <div className={styles.picker}>
        <header><strong>Add context</strong><button onClick={() => setPicker(false)}>Done</button></header>
        <div className={styles.pickerSection}><small>CELE TOPICS</small>{areas.map(area => <details key={area.key}><summary>{area.short}</summary><div>{area.topics.map(topic => <button key={topic.slug} onClick={() => chooseTopic(area.key, topic.slug, topic.name)}>{topic.name}</button>)}</div></details>)}</div>
        <div className={styles.pickerSection}><small>MY LIBRARY</small>{materials.length ? materials.slice(0,12).map(item => <button key={item.id} disabled={attaching === item.id} onClick={() => chooseMaterial(item)}>{attaching === item.id ? "Reading…" : item.title}<span>{item.category.replaceAll("-", " ")}</span></button>) : <p>No readable materials yet.</p>}</div>
      </div>}
      <div className={styles.composer}>
        <button className={styles.contextButton} onClick={() => setPicker(value => !value)} aria-label="Add study context">+</button>
        <textarea ref={inputRef} rows={compact ? 1 : 2} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={context ? `Ask about ${context.label}…` : "Ask Jace about CE or CELE…"}/>
        <button className={styles.send} disabled={!input.trim() || busy} onClick={() => send()} aria-label="Send to Jace">↑</button>
      </div>
      {!compact && <div className={styles.disclaimer}>Engineering correctness first. Verify code-specific assumptions, constants, and official requirements when they matter.</div>}
    </div>
  </section>;
}
