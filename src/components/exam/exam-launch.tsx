"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAttempt, getExam } from "@/lib/exam-store";
import { CELE_SIMULATION_STANDARD } from "@/lib/simulation/cele-config";
import type { PRCBlockKey, StructuredExam } from "@/lib/exam-types";
import styles from "./exam-launch.module.css";

export function ExamLaunch({ examId }: { examId: string }) {
  const [exam, setExam] = useState<StructuredExam | null>(null);
  const [block, setBlock] = useState<PRCBlockKey>("structural");

  useEffect(() => setExam(getExam(examId)), [examId]);

  const suggested = useMemo(() => {
    if (!exam) return null;
    const counts = new Map<PRCBlockKey, number>([["structural", 0], ["mste", 0], ["hge", 0]]);
    for (const q of exam.questions) {
      if (q.areaKey) counts.set(q.areaKey, (counts.get(q.areaKey) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [exam]);

  useEffect(() => {
    if (suggested) setBlock(suggested);
  }, [suggested]);

  if (!exam) return <div className={styles.missing}>Practice set not found.</div>;

  const unfinished = getAttempt(examId);
  const selectedBlock = CELE_SIMULATION_STANDARD.blocks.find((item) => item.key === block)!;

  return (
    <div className={styles.page}>
      <Link className={styles.back} href="/practice">← Practice</Link>

      <section className={styles.hero}>
        <small>VERIFIED PAPER</small>
        <h1>{exam.title}</h1>
        <p>{exam.questions.length} questions · source timing {exam.durationMinutes} min</p>
      </section>

      {unfinished && !unfinished.submittedAt && (
        <section className={styles.resume}>
          <div>
            <small>AUTOSAVED</small>
            <b>{unfinished.mode === "simulation" ? "Simulation" : "Practice"} in progress</b>
            <span>Question {unfinished.currentIndex + 1} · answers are stored on this device.</span>
          </div>
          <Link href={`/practice/${exam.id}/run?mode=${unfinished.mode}${unfinished.simulationStandard === "prc-2026" && unfinished.prcBlock ? `&standard=prc-2026&block=${unfinished.prcBlock}` : ""}`}>Resume →</Link>
        </section>
      )}

      <section className={styles.modeSection}>
        <small>CHOOSE A MODE</small>
        <div className={styles.modes}>
          <article>
            <span className={styles.modeTag}>LEARN</span>
            <h2>Practice Mode</h2>
            <p>Answer at your own pace. Check keyed answers, review mistakes, and ask Jace while you work.</p>
            <ul>
              <li>Feedback after answering</li>
              <li>Ask Jace available</li>
              <li>No exam-pressure timer</li>
            </ul>
            <Link href={`/practice/${exam.id}/run?mode=practice`}>Start Practice</Link>
          </article>

          <article className={styles.simCard}>
            <span className={styles.modeTag}>FOCUS</span>
            <h2>Simulation Mode</h2>
            <p>No hints or answer feedback before submission. The paper stays autosaved locally.</p>
            <ul>
              <li>Timed</li>
              <li>Answer sheet + flags</li>
              <li>Jace hidden until submission</li>
            </ul>
            <Link href={`/practice/${exam.id}/run?mode=simulation&standard=custom`}>Use paper timing · {exam.durationMinutes} min</Link>
          </article>
        </div>
      </section>

      <section className={styles.prc}>
        <div className={styles.prcHead}>
          <div>
            <small>PRC SIMULATION</small>
            <h2>Use the current official CELE block timing.</h2>
          </div>
          <span>{CELE_SIMULATION_STANDARD.effectiveFrom}</span>
        </div>
        <p className={styles.prcCopy}>
          The official clock duration is applied to this paper. The app does not alter or invent the paper's question count; it only applies the selected PRC time block.
        </p>

        <div className={styles.blockPicker}>
          {CELE_SIMULATION_STANDARD.blocks.map((item) => (
            <button key={item.key} className={block === item.key ? styles.selected : ""} onClick={() => setBlock(item.key)}>
              <b>{item.shortLabel}</b>
              <span>{item.durationMinutes / 60}h · {item.officialStart}–{item.officialEnd}</span>
            </button>
          ))}
        </div>

        <div className={styles.prcSummary}>
          <span>Selected</span>
          <b>{selectedBlock.subject}</b>
          <small>Day {selectedBlock.day} · {selectedBlock.weight}% of CELE · {selectedBlock.durationMinutes / 60} hours</small>
          {selectedBlock.knownQuestionCount && <small>PRC specifically notes {selectedBlock.knownQuestionCount} computation-heavy questions for this block.</small>}
        </div>

        <Link className={styles.prcStart} href={`/practice/${exam.id}/run?mode=simulation&standard=prc-2026&block=${block}`}>
          Start PRC-timed simulation
        </Link>
        <a className={styles.source} href={CELE_SIMULATION_STANDARD.sourceUrl} target="_blank" rel="noreferrer">Official PRC source ↗</a>
      </section>
    </div>
  );
}
