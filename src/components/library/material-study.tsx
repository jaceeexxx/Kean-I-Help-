"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { getLibraryFile } from "@/lib/library-service";
import { extractMaterialText, materialContext } from "@/lib/material-context";
import { askJace, openAskJace } from "@/lib/ask-jace-client";
import { saveAiReviewItem } from "@/lib/ai-review-store";
import type { LibraryItem } from "@/lib/library-types";
import type { AskJaceContext } from "@/lib/ask-jace-types";
import styles from "./material-study.module.css";

export function MaterialStudy({ id }: { id: string }) {
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [context, setContext] = useState<AskJaceContext | null>(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("Reading the original…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [practice, setPractice] = useState("");
  const [practiceBusy, setPracticeBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await getLibraryFile(id);
        if (!loaded) throw new Error("This Library item could not be found.");
        setItem(loaded.item);
        const text = await extractMaterialText(loaded.item, loaded.blob);
        if (!text) throw new Error("No readable text was found in this material.");
        setContext(materialContext(loaded.item, text));
        setStatus(`${Math.min(text.length, 18_000).toLocaleString()} source characters ready for grounded study.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read this material.");
        setStatus("");
      }
    })();
  }, [id]);

  async function generate() {
    if (!context || !item || busy) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const result = await askJace({
        message: `Build a focused CELE study session from “${item.title}”. Stay faithful to the source. Organize it as: what matters, key ideas/formulas, one worked-through explanation when useful, and a short self-check.`,
        action: "material_study",
        context,
      });
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the study session.");
    } finally { setBusy(false); }
  }

  async function generatePractice() {
    if (!context || !item || practiceBusy) return;
    setPracticeBusy(true); setError("");
    try {
      const result = await askJace({
        message: `Create a source-grounded targeted practice set from “${item.title}”. Focus on concepts useful for CELE-style problem solving. Do not invent facts that are not supported by the material.`,
        action: "source_practice",
        context,
      });
      setPractice(result.answer);
      saveAiReviewItem({ kind: "source-practice", title: `Source Practice · ${item.title}`, content: result.answer, sourceId: item.id, sourceTitle: item.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate source practice.");
    } finally { setPracticeBusy(false); }
  }

  function save() {
    if (!answer || !item) return;
    saveAiReviewItem({ kind: "material-study", title: `Study · ${item.title}`, content: answer, sourceId: item.id, sourceTitle: item.title });
    setSaved(true);
  }

  return <div className={styles.page}>
    <Link href={`/review/library/${id}`}>← Study Desk</Link>
    <section className={styles.hero}><small>STUDY FROM THIS</small><h1>{item?.title || "Preparing material…"}</h1><p>{status}</p></section>
    {error && <div className={styles.error}>{error}</div>}
    {context && !answer && <div className={styles.ready}><JaceSticker mood="explaining" size={58}/><div><b>Source attached.</b><p>Jace will use this material as the reference. The original stays separate and untouched.</p></div></div>}
    {!answer && <div className={styles.generateRow}><button className={styles.generate} disabled={!context || busy} onClick={generate}>{busy ? "Building study session…" : "Build study session"}</button><button className={styles.practiceBtn} disabled={!context || practiceBusy} onClick={generatePractice}>{practiceBusy ? "Generating practice…" : "Create targeted practice"}</button></div>}
    {practice&&<article className={styles.practiceOutput}><small>SOURCE-GROUNDED PRACTICE · SAVED</small><p>{practice}</p></article>}
    {answer && <article className={styles.output}><small>GENERATED FROM YOUR MATERIAL</small><p>{answer}</p><div><button onClick={save}>{saved ? "Saved to Review ✓" : "Save to Review"}</button><button onClick={() => context && openAskJace({ context, action: "freeform", message: "I'm studying this source. Help me with the part I'm still confused about." })}>Continue with Jace</button></div></article>}
    <div className={styles.note}>Generated study content is separate from the source file. Kean’s original upload is never overwritten.</div>
  </div>;
}
