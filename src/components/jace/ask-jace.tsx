"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ASK_JACE_OPEN_EVENT, type AskJaceOpenDetail } from "@/lib/ask-jace-client";
import type { AskJaceAction, AskJaceContext } from "@/lib/ask-jace-types";
import { listLocalJaceConversations, type JaceConversation } from "@/lib/jace-conversations";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { JaceChatCore } from "./jace-chat-core";
import styles from "./ask-jace.module.css";

export function AskJace() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AskJaceContext | null>(null);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<AskJaceAction>("freeform");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recent, setRecent] = useState<JaceConversation[]>([]);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<AskJaceOpenDetail>).detail || {};
      setContext(detail.context || null);
      setMessage(detail.message || "");
      setAction(detail.action || "freeform");
      setConversationId(null);
      setRecent(listLocalJaceConversations().slice(0, 3));
      setOpen(true);
    };
    window.addEventListener(ASK_JACE_OPEN_EVENT, listener);
    return () => window.removeEventListener(ASK_JACE_OPEN_EVENT, listener);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRecent(listLocalJaceConversations().slice(0, 3));
  }, [open, conversationId]);

  if (pathname.startsWith("/onboarding") || pathname.startsWith("/jace") || pathname.includes("/run")) return null;

  function openThread(id: string) {
    setOpen(false);
    router.push(`/jace/${id}`);
  }

  return open ? <div className={styles.backdrop} onMouseDown={() => setOpen(false)}>
    <aside className={styles.panel} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Ask Jace">
      <header className={styles.header}>
        <div className={styles.identity}><JaceSticker mood="default" size={62}/><div><small>ASK JACE</small><h2>{context ? "I'm with you here." : "What do you need?"}</h2><p>{context ? context.label : "CELE help without leaving what you're doing."}</p></div></div>
        <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close Ask Jace">×</button>
      </header>

      <div className={styles.chat}>
        <JaceChatCore
          key={`${context?.label || "general"}-${conversationId || "new"}-${message}`}
          compact
          conversationId={conversationId}
          initialContext={context}
          initialMessage={message}
          initialAction={action}
          autoFocus={Boolean(message)}
          onConversationCreated={id => { setConversationId(id); setRecent(listLocalJaceConversations().slice(0,3)); }}
        />
      </div>

      <footer className={styles.footer}>
        {!conversationId && recent.length ? <div className={styles.recent}><span>RECENT</span>{recent.map(thread => <button key={thread.id} onClick={() => openThread(thread.id)}><strong>{thread.title}</strong><small>{new Date(thread.updatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</small></button>)}</div> : null}
        <Link href={conversationId ? `/jace/${conversationId}` : "/jace"} onClick={() => setOpen(false)}>Open full Ask Jace →</Link>
      </footer>
    </aside>
  </div> : null;
}
