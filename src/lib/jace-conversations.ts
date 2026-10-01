import type { AskJaceAction, AskJaceContext } from "./ask-jace-types";
import { createClient, isSupabaseConfigured } from "./supabase/client";

const KEY = "kih:jace-conversations:v2";
const MAX_LOCAL_THREADS = 40;
const MAX_MESSAGES_PER_THREAD = 120;

export type JaceSource = { id?: string; title: string };

export type JaceConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  action?: AskJaceAction;
  model?: string;
  sources?: JaceSource[];
};

export type JaceConversation = {
  id: string;
  title: string;
  context?: AskJaceContext | null;
  messages: JaceConversationMessage[];
  createdAt: string;
  updatedAt: string;
};

function readLocal(): JaceConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]") as JaceConversation[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocal(items: JaceConversation[]) {
  if (typeof window === "undefined") return;
  const trimmed = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_LOCAL_THREADS)
    .map(item => ({ ...item, messages: item.messages.slice(-MAX_MESSAGES_PER_THREAD) }));
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent("jace:conversations-changed"));
}

async function cloudContext() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export function listLocalJaceConversations() {
  return readLocal().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalJaceConversation(id: string) {
  return readLocal().find(item => item.id === id) || null;
}

export async function refreshJaceConversationsFromCloud() {
  const local = readLocal();
  try {
    const ctx = await cloudContext();
    if (!ctx) return local;
    const { data: threads, error } = await ctx.supabase
      .from("ask_jace_threads")
      .select("id,title,context,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(MAX_LOCAL_THREADS);
    if (error) throw error;
    if (!threads?.length) return local;
    const ids = threads.map(row => String(row.id));
    const { data: messages, error: messageError } = await ctx.supabase
      .from("ask_jace_messages")
      .select("id,thread_id,role,content,model,sources,created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: true });
    if (messageError) throw messageError;
    const byThread = new Map<string, JaceConversationMessage[]>();
    for (const row of messages || []) {
      const id = String(row.thread_id);
      const list = byThread.get(id) || [];
      list.push({
        id: String(row.id),
        role: row.role as "user" | "assistant",
        content: String(row.content),
        model: row.model ? String(row.model) : undefined,
        sources: Array.isArray(row.sources) ? row.sources as JaceSource[] : [],
        createdAt: String(row.created_at),
      });
      byThread.set(id, list);
    }
    const cloud: JaceConversation[] = threads.map(row => {
      const rawContext = row.context && typeof row.context === "object" ? row.context as Partial<AskJaceContext> : null;
      const validContext = rawContext?.kind && rawContext?.label && typeof rawContext.text === "string" ? rawContext as AskJaceContext : null;
      return {
        id: String(row.id),
        title: String(row.title || "Ask Jace"),
        context: validContext,
        messages: byThread.get(String(row.id)) || [],
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      };
    });
    const cloudIds = new Set(cloud.map(item => item.id));
    const merged = [...cloud, ...local.filter(item => !cloudIds.has(item.id))];
    writeLocal(merged);
    return merged.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return local.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

function titleFromMessage(message: string, context?: AskJaceContext | null) {
  if (context?.label) return context.label.slice(0, 72);
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length > 54 ? `${compact.slice(0, 51)}…` : compact || "Ask Jace";
}

export async function createJaceConversation(input: { title?: string; context?: AskJaceContext | null; firstMessage?: string } = {}) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const item: JaceConversation = {
    id,
    title: input.title || titleFromMessage(input.firstMessage || "", input.context),
    context: input.context || null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  writeLocal([item, ...readLocal()]);
  try {
    const ctx = await cloudContext();
    if (ctx) await ctx.supabase.from("ask_jace_threads").insert({
      id,
      user_id: ctx.user.id,
      title: item.title,
      context: item.context || {},
      created_at: now,
      updated_at: now,
    });
  } catch {}
  return item;
}

export async function updateJaceConversation(id: string, patch: Partial<Pick<JaceConversation, "title" | "context">>) {
  const now = new Date().toISOString();
  const all = readLocal();
  const current = all.find(item => item.id === id);
  if (!current) return null;
  const next: JaceConversation = { ...current, ...patch, updatedAt: now };
  writeLocal(all.map(item => item.id === id ? next : item));
  try {
    const ctx = await cloudContext();
    if (ctx) {
      const cloudPatch: Record<string, unknown> = { updated_at: now };
      if (patch.title !== undefined) cloudPatch.title = patch.title;
      if (patch.context !== undefined) cloudPatch.context = patch.context || {};
      await ctx.supabase.from("ask_jace_threads").update(cloudPatch).eq("id", id);
    }
  } catch {}
  return next;
}

export async function appendJaceConversationMessage(
  conversationId: string,
  message: Omit<JaceConversationMessage, "id" | "createdAt"> & { id?: string; createdAt?: string },
) {
  const all = readLocal();
  const current = all.find(item => item.id === conversationId);
  if (!current) return null;
  const row: JaceConversationMessage = {
    ...message,
    id: message.id || crypto.randomUUID(),
    createdAt: message.createdAt || new Date().toISOString(),
  };
  const next: JaceConversation = {
    ...current,
    messages: [...current.messages, row].slice(-MAX_MESSAGES_PER_THREAD),
    updatedAt: row.createdAt,
  };
  writeLocal(all.map(item => item.id === conversationId ? next : item));
  try {
    const ctx = await cloudContext();
    if (ctx) {
      await ctx.supabase.from("ask_jace_messages").insert({
        id: row.id,
        user_id: ctx.user.id,
        thread_id: conversationId,
        role: row.role,
        content: row.content,
        model: row.model || null,
        sources: row.sources || [],
        created_at: row.createdAt,
      });
      await ctx.supabase.from("ask_jace_threads").update({ updated_at: row.createdAt }).eq("id", conversationId);
    }
  } catch {}
  return next;
}

export async function deleteJaceConversation(id: string) {
  writeLocal(readLocal().filter(item => item.id !== id));
  try {
    const ctx = await cloudContext();
    if (ctx) await ctx.supabase.from("ask_jace_threads").delete().eq("id", id);
  } catch {}
}

export async function clearJaceConversationContext(id: string) {
  return updateJaceConversation(id, { context: null });
}
