"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { JaceChatCore } from "./jace-chat-core";
import {
  deleteJaceConversation,
  listLocalJaceConversations,
  refreshJaceConversationsFromCloud,
  type JaceConversation,
} from "@/lib/jace-conversations";
import styles from "./jace-workspace.module.css";

export function JaceWorkspace({ conversationId = null }: { conversationId?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [threads, setThreads] = useState<JaceConversation[]>([]);
  const activeId = conversationId || null;

  useEffect(() => {
    setThreads(listLocalJaceConversations());
    refreshJaceConversationsFromCloud().then(setThreads).catch(() => {});
    const update = () => setThreads(listLocalJaceConversations());
    window.addEventListener("jace:conversations-changed", update);
    return () => window.removeEventListener("jace:conversations-changed", update);
  }, []);

  const active = useMemo(() => threads.find(item => item.id === activeId) || null, [threads, activeId]);

  async function remove(thread: JaceConversation) {
    if (!confirm(`Delete “${thread.title}”?`)) return;
    await deleteJaceConversation(thread.id);
    setThreads(listLocalJaceConversations());
    if (activeId === thread.id) router.replace("/jace");
  }

  return <div className={styles.page}>
    <aside className={styles.history}>
      <header><div><small>ASK JACE</small><h1>Conversations</h1></div><Link href="/jace" aria-label="New Ask Jace conversation">＋</Link></header>
      <div className={styles.newCard}>
        <JaceSticker mood="default" size={62}/>
        <div><strong>Need a hand?</strong><span>Start anywhere. Jace can follow lessons, questions, materials, and progress.</span></div>
      </div>
      <nav aria-label="Ask Jace conversation history">
        {threads.length ? threads.map(thread => <div key={thread.id} className={`${styles.threadRow} ${activeId === thread.id ? styles.active : ""}`}>
          <Link href={`/jace/${thread.id}`}>
            <strong>{thread.title}</strong>
            <span>{thread.context?.kind ? `${thread.context.kind.replaceAll("-", " ")} · ` : ""}{new Date(thread.updatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span>
          </Link>
          <button onClick={() => remove(thread)} aria-label={`Delete ${thread.title}`}>×</button>
        </div>) : <div className={styles.empty}>Your useful Jace conversations will stay here.</div>}
      </nav>
    </aside>

    <main className={styles.chatPane}>
      <div className={styles.mobileBar}><Link href="/jace">‹</Link><strong>{active?.title || "Ask Jace"}</strong><Link href="/jace" aria-label="New conversation">＋</Link></div>
      <JaceChatCore
        key={`${activeId || "new"}-${pathname}`}
        conversationId={activeId}
        autoFocus={!activeId}
        onConversationCreated={id => {
          setThreads(listLocalJaceConversations());
          router.replace(`/jace/${id}`);
        }}
      />
    </main>
  </div>;
}
