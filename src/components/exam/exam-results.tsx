"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { areas, getTopic, type AreaKey } from "@/lib/curriculum";
import { getAttempt, getExam } from "@/lib/exam-store";
import { buildTomorrowPlan, scoreAttempt } from "@/lib/progress";
import { emitJaceReaction } from "@/lib/jace-personality";
import { openAskJace } from "@/lib/ask-jace-client";
import { getAdaptivePriorities } from "@/lib/adaptive";
import { CELE_SIMULATION_STANDARD, getCELEBlock } from "@/lib/simulation/cele-config";
import { generateRemediation } from "@/lib/adaptive-ai";
import type { ExamAttempt, ExamQuestion, StructuredExam } from "@/lib/exam-types";
import styles from "./exam-results.module.css";

export function ExamResults({ examId }: { examId: string }) {
  const [exam, setExam] = useState<StructuredExam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [built, setBuilt] = useState(false);
  const [repairBusy, setRepairBusy] = useState(false);
  const [repair, setRepair] = useState("");

  useEffect(() => { setExam(getExam(examId)); setAttempt(getAttempt(examId)); }, [examId]);
  useEffect(() => {
    if (!exam || !attempt?.submittedAt) return;
    const scored = scoreAttempt(attempt);
    if (scored.score === null) return;
    const event = scored.score >= 80 ? "exam-high" : scored.score >= 60 ? "exam-mid" : "exam-low";
    const timer = window.setTimeout(() => emitJaceReaction(event, { reactionKey: `exam-result:${attempt.id}` }), 1200);
    return () => window.clearTimeout(timer);
  }, [exam, attempt]);

  const breakdown = useMemo(() => exam && attempt ? areaBreakdown(exam, attempt) : [], [exam, attempt]);
  if (!exam || !attempt?.submittedAt) return <div className={styles.missing}>Submitted result not found.</div>;

  // Preserve the post-guard non-null types inside event handlers and async callbacks.
  const loadedExam = exam;
  const submittedAttempt = attempt;

  const score = scoreAttempt(attempt);
  const sessionSeconds = Math.max(0, Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000));
  const activeSeconds = exam.questions.reduce((sum, question) => sum + (attempt.questionTimesSec?.[question.id] || 0), 0);
  const avg = score.answered ? Math.round(activeSeconds / score.answered) : 0;
  const unanswered = Math.max(0, score.total - score.answered);
  const misses = exam.questions.filter((question) => question.correctKey && attempt.answers[question.id] !== question.correctKey);
  const simulationBlock = getCELEBlock(attempt.prcBlock);

  function makePlan() {
    buildTomorrowPlan(); setBuilt(true);
    emitJaceReaction("plan-built", { reactionKey: `plan-from-result:${submittedAttempt.id}` });
  }

  async function buildRemediation() {
    const missed = misses.find((question) => question.areaKey && question.topicSlug);
    if (!missed?.areaKey || !missed.topicSlug) return;
    const priority = getAdaptivePriorities().find((item) => item.areaKey === missed.areaKey && item.topicSlug === missed.topicSlug);
    if (!priority) return;
    setRepairBusy(true); setRepair("");
    try {
      const extra = `${missed.prompt}\n${missed.choices.map((choice) => `${choice.key}. ${choice.text}`).join("\n")}\nLearner answer: ${submittedAttempt.answers[missed.id] || "Unanswered"}\nKey: ${missed.correctKey}`;
      const generated = await generateRemediation(priority, extra);
      setRepair(generated.result.answer);
    } catch (err) { setRepair(err instanceof Error ? err.message : "Could not generate remediation."); }
    finally { setRepairBusy(false); }
  }

  function askNext() {
    openAskJace({
      action: "study_next",
      context: {
        kind: "progress",
        label: `${loadedExam.title} result`,
        text: `Score: ${score.score === null ? "No trustworthy percentage" : `${score.score}%`}\nAnswered: ${score.answered}/${score.total}\nUnanswered: ${unanswered}\nAverage active time per answered question: ${avg}s\nFlagged: ${submittedAttempt.flagged.length}\nMissed keyed questions: ${misses.length}.`,
      },
      message: "Based on this result, tell me the most useful thing to review next and why. Keep the recommendation grounded in the result.",
    });
  }

  return <div className={styles.page}>
    <Link href="/practice" className={styles.back}>← Practice</Link>

    <header className={styles.hero}>
      <span>{attempt.mode === "simulation" ? "SIMULATION COMPLETE" : "PRACTICE COMPLETE"}</span>
      <h1>{exam.title}</h1>
      <p>{new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(new Date(attempt.submittedAt))}{attempt.autoSubmitted ? " · submitted when time expired" : ""}</p>
      {attempt.simulationStandard === "prc-2026" && simulationBlock && <div className={styles.standard}><b>{CELE_SIMULATION_STANDARD.label}</b><span>{simulationBlock.shortLabel} · {simulationBlock.durationMinutes / 60}h official block duration</span></div>}
    </header>

    <section className={styles.scoreBlock}>
      <div className={styles.primaryScore}><strong>{score.score === null ? "—" : `${score.score}%`}</strong><span>{score.score === null ? "no trustworthy keyed percentage" : `${score.correct} of ${score.keyed} keyed questions correct`}</span></div>
      <div><b>{score.answered}/{score.total}</b><span>answered</span></div>
      <div><b>{unanswered}</b><span>unanswered</span></div>
      <div><b>{avg}s</b><span>active avg/question</span></div>
    </section>

    <section className={styles.analysis}>
      <span>WHAT THIS MEANS</span>
      <h2>{resultHeadline(score.score)}</h2>
      <p>{resultCopy(score.score, misses.length, unanswered)}</p>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>BY CELE AREA</span><h2>Where the result came from</h2></div>
      <div className={styles.areas}>{breakdown.map((area) => <article key={area.key}>
        <div><b>{area.short}</b><span>{area.weight}% of CELE</span></div>
        <div className={styles.areaScore}><strong>{area.keyed ? `${area.accuracy}%` : "—"}</strong><small>{area.correct}/{area.keyed} keyed · {area.answered} answered</small></div>
      </article>)}</div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>MISSES</span><h2>{misses.length ? `${misses.length} keyed questions to revisit` : "No keyed misses in this attempt"}</h2></div>
      {misses.length ? <div className={styles.misses}>{misses.slice(0, 10).map((question) => {
        const answer = attempt.answers[question.id] || null;
        return <article key={question.id}>
          <header><span>Q{question.number} · {question.topicSlug && question.areaKey ? getTopic(question.areaKey, question.topicSlug)?.name || question.areaKey.toUpperCase() : question.areaKey?.toUpperCase() || "Untagged"}</span><span>{attempt.questionTimesSec?.[question.id] || 0}s</span></header>
          <p>{question.prompt}</p>
          <div><span>You chose <b>{answer || "—"}</b></span><span>Key <b>{question.correctKey}</b></span></div>
          <button onClick={() => openAskJace({ context: questionContext(question, exam, attempt), action: "why_wrong", message: "Explain where my reasoning likely went wrong, why the keyed answer works, and one clue I should notice next time." })}>Ask Jace why</button>
        </article>;
      })}</div> : <p className={styles.muted}>There is nothing in the keyed set to repair from this attempt.</p>}
      {misses.length > 10 && <Link className={styles.quietLink} href="/progress/mistakes">Open all mistakes →</Link>}
    </section>

    <section className={styles.next}>
      <div><span>NEXT MOVE</span><h2>Turn the result into tomorrow's review.</h2><p>Keep the follow-up short. Revisit the evidence, repair recent misses, then move on.</p></div>
      <div className={styles.nextActions}><button onClick={makePlan}>{built ? "Tomorrow's review is ready ✓" : "Build Tomorrow's Review"}</button><button className={styles.secondary} onClick={buildRemediation} disabled={repairBusy || !misses.length}>{repairBusy ? "Building…" : "Build targeted remediation"}</button></div>
      {repair && <div className={styles.repair}><span>REMEDIATION</span><p>{repair}</p><Link href="/review/saved">Open Saved Review →</Link></div>}
    </section>

    <section className={styles.jaceAfter}>
      <JaceSticker mood={score.score !== null && score.score >= 80 ? "proud" : "gentle"} size={94} />
      <div><span>AFTER THE ANALYSIS</span><h2>Want Jace's take?</h2><p>The score and question evidence come first. Jace can use them to explain the next practical move.</p><button onClick={askNext}>Ask Jace what to study next</button></div>
    </section>

    <div className={styles.footerLinks}><Link href="/progress">See full Progress</Link><Link href="/practice">Back to Practice</Link></div>
  </div>;
}

function areaBreakdown(exam: StructuredExam, attempt: ExamAttempt) {
  return areas.map((area) => {
    const questions = exam.questions.filter((question) => question.areaKey === area.key);
    const answered = questions.filter((question) => attempt.answers[question.id]).length;
    const keyed = questions.filter((question) => question.correctKey);
    const correct = keyed.filter((question) => attempt.answers[question.id] === question.correctKey).length;
    return { key: area.key, short: area.short, weight: area.weight, answered, keyed: keyed.length, correct, accuracy: keyed.length ? Math.round((correct / keyed.length) * 100) : 0 };
  }).filter((area) => area.answered > 0 || area.keyed > 0);
}

function questionContext(question: ExamQuestion, exam: StructuredExam, attempt: ExamAttempt) {
  const selected = attempt.answers[question.id] || "Unanswered";
  return {
    kind: "exam-question" as const,
    label: `Question ${question.number} · ${exam.title}`,
    text: `${question.prompt}\n${question.choices.map((choice) => `${choice.key}. ${choice.text}`).join("\n")}\n\nLearner answer: ${selected}${question.correctKey ? `\nKeyed answer: ${question.correctKey}` : ""}`,
    areaKey: question.areaKey,
    topicSlug: question.topicSlug,
  };
}

function resultHeadline(score: number | null) {
  if (score === null) return "Keep the answers and timing; skip the fake score.";
  if (score >= 85) return "Strong result. Protect it with spaced review.";
  if (score >= 70) return "The foundation is working; the misses show what to tighten.";
  if (score >= 55) return "Useful baseline. Repair repeated mistakes before adding speed.";
  return "Treat this as a map of what needs repair, not a verdict.";
}

function resultCopy(score: number | null, misses: number, unanswered: number) {
  if (score === null) return "This paper does not have enough trusted answer keys for a defensible percentage. The saved answers, flags, and timing are still useful evidence.";
  const blank = unanswered ? ` There ${unanswered === 1 ? "was" : "were"} ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}.` : "";
  return `${misses} keyed question${misses === 1 ? "" : "s"} were missed. Review patterns across topics before reacting to the percentage alone.${blank}`;
}
