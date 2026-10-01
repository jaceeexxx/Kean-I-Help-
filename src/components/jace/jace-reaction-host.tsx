"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { JaceReaction } from "@/lib/jace-personality";
import { loadJacePreferences } from "@/lib/jace-preferences";
import styles from "./jace-reaction-host.module.css";

export function JaceReactionHost() {
  const pathname = usePathname();
  const [reaction, setReaction] = useState<JaceReaction | null>(null);

  useEffect(() => {
    function onReaction(event: Event) {
      if (!loadJacePreferences().stickerReactionsEnabled) return;
      setReaction((event as CustomEvent<JaceReaction>).detail);
    }
    function onPreferences(){ if(!loadJacePreferences().stickerReactionsEnabled) setReaction(null); }
    window.addEventListener("jace:reaction", onReaction);
    window.addEventListener("jace:preferences", onPreferences);
    return () => { window.removeEventListener("jace:reaction", onReaction); window.removeEventListener("jace:preferences", onPreferences); };
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(() => setReaction(null), 5200);
    return () => window.clearTimeout(timer);
  }, [reaction]);

  if (pathname.includes("/run") || !reaction) return null;

  return <aside className={`${styles.host} ${styles[reaction.tone]}`} role="status" aria-live="polite">
    <button className={styles.dismiss} onClick={() => setReaction(null)} aria-label="Dismiss Jace reaction">×</button>
    <div className={styles.sticker} aria-hidden="true">
      <span className={styles.emoji}>{reaction.emoji}</span>
      <span className={styles.face}>J</span>
    </div>
    <div className={styles.bubble}>
      <small>JACE</small>
      <p>{reaction.line}</p>
    </div>
  </aside>;
}
