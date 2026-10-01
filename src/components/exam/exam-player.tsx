"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlagIcon, GridIcon } from "@/components/ui/icons";
import { getAttempt, getExam, recordSubmittedAttempt, saveAttempt } from "@/lib/exam-store";
import { openAskJace } from "@/lib/ask-jace-client";
import { CELE_SIMULATION_STANDARD, getCELEBlock } from "@/lib/simulation/cele-config";
import { createExpiry, formatClock, getElapsedSeconds, getRemainingSeconds } from "@/lib/simulation/clock";
import type { ExamAttempt, ExamMode, PRCBlockKey, StructuredExam } from "@/lib/exam-types";
import styles from "./exam-player.module.css";

function withCurrentQuestionTime(attempt: ExamAttempt, questionId: string, nextIndex = attempt.currentIndex): ExamAttempt {
  const enteredAt = attempt.lastQuestionEnteredAt ? new Date(attempt.lastQuestionEnteredAt).getTime() : Date.now();
  const expiry = attempt.expiresAt ? new Date(attempt.expiresAt).getTime() : Number.POSITIVE_INFINITY;
  const effectiveNow = Math.min(Date.now(), expiry);
  const delta = Math.max(0, Math.round((effectiveNow - enteredAt) / 1000));
  return {
    ...attempt,
    questionTimesSec: {
      ...attempt.questionTimesSec,
      [questionId]: (attempt.questionTimesSec[questionId] || 0) + delta,
    },
    currentIndex: nextIndex,
    lastQuestionEnteredAt: new Date(effectiveNow).toISOString(),
  };
}

function attemptMatchesRequest(attempt: ExamAttempt, mode: ExamMode, standard: "custom" | "prc-2026", block?: PRCBlockKey) {
  if (attempt.submittedAt || attempt.mode !== mode) return false;
  if (mode === "practice") return true;
  if ((attempt.simulationStandard || "custom") !== standard) return false;
  if (standard === "prc-2026" && attempt.prcBlock !== block) return false;
  return true;
}

export function ExamPlayer({ examId }: { examId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const mode = (params.get("mode") === "simulation" ? "simulation" : "practice") as ExamMode;
  const standard = params.get("standard") === "prc-2026" ? "prc-2026" : "custom";
  const requestedBlock = getCELEBlock(params.get("block"));

  const [exam, setExam] = useState<StructuredExam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [sheet, setSheet] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reviewSubmit, setReviewSubmit] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now());
  const autoSubmitted = useRef(false);

  useEffect(() => {
    const loadedExam = getExam(examId);
    setExam(loadedExam);
    if (!loadedExam) return;

    const block = standard === "prc-2026" ? requestedBlock : null;
    const durationMinutes = mode === "simulation" && block ? block.durationMinutes : loadedExam.durationMinutes;
    const oldAttempt = getAttempt(examId);
    const canResume = oldAttempt && attemptMatchesRequest(oldAttempt, mode, standard, block?.key);

    if (canResume) {
      const normalized = oldAttempt.mode === "simulation" && !oldAttempt.expiresAt
        ? { ...oldAttempt, expiresAt: createExpiry(oldAttempt.startedAt, oldAttempt.durationMinutes) }
        : oldAttempt;
      setAttempt(normalized);
      saveAttempt(normalized);
      return;
    }

    const startedAt = new Date().toISOString();
    const nextAttempt: ExamAttempt = {
      id: crypto.randomUUID(),
      examId,
      mode,
      startedAt,
      expiresAt: mode === "simulation" ? createExpiry(startedAt, durationMinutes) : undefined,
      answers: {},
      flagged: [],
      currentIndex: 0,
      durationMinutes,
      questionTimesSec: {},
      lastQuestionEnteredAt: startedAt,
      simulationStandard: mode === "simulation" ? standard : undefined,
      prcBlock: block?.key,
      guidelineVersion: block ? CELE_SIMULATION_STANDARD.guidelineVersion : undefined,
    };
    setAttempt(nextAttempt);
    saveAttempt(nextAttempt);
  }, [examId, mode, standard, requestedBlock?.key]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  useEffect(() => {
    if (attempt) saveAttempt(attempt);
  }, [attempt]);

  const elapsed = attempt ? getElapsedSeconds(attempt.startedAt, now) : 0;
  const remaining = attempt?.mode === "simulation" && attempt.expiresAt
    ? getRemainingSeconds(attempt.expiresAt, now)
    : 0;

  useEffect(() => {
    if (mode !== "simulation" || !exam || !attempt || attempt.submittedAt || remaining > 0 || autoSubmitted.current) return;
    autoSubmitted.current = true;
    const question = exam.questions[attempt.currentIndex];
    const timed = question ? withCurrentQuestionTime(attempt, question.id) : attempt;
    const completed: ExamAttempt = { ...timed, submittedAt: new Date().toISOString(), autoSubmitted: true };
    recordSubmittedAttempt(completed);
    setAttempt(completed);
    router.replace(`/practice/${examId}/results`);
  }, [mode, exam, attempt, remaining, router, examId]);

  const block = useMemo(() => getCELEBlock(attempt?.prcBlock), [attempt?.prcBlock]);

  if (!exam || !attempt) return <div data-exam-run className={styles.loading}>Opening practice…</div>;

  const question = exam.questions[attempt.currentIndex];
  if (!question) return <div data-exam-run className={styles.loading}>This paper has no question at the current position.</div>;

  const answer = attempt.answers[question.id];
  const flagged = attempt.flagged.includes(question.id);
  const feedback = mode === "practice" && checked[question.id] && Boolean(question.correctKey);
  const correct = feedback && answer === question.correctKey;
  const answeredCount = exam.questions.filter((item) => attempt.answers[item.id]).length;
  const unanswered = exam.questions.filter((item) => !attempt.answers[item.id]);
  const isSimulation = mode === "simulation";

  function commitTime(nextIndex: number) {
    setAttempt(withCurrentQuestionTime(attempt!, question.id, nextIndex));
  }

  function go(index: number) {
    const bounded = Math.max(0, Math.min(exam!.questions.length - 1, index));
    commitTime(bounded);
    setSheet(false);
  }

  function chooseAnswer(key: string) {
    if (isSimulation && remaining <= 0) return;
    setAttempt({ ...attempt!, answers: { ...attempt!.answers, [question.id]: key } });
  }

  function toggleFlag() {
    setAttempt({
      ...attempt!,
      flagged: flagged ? attempt!.flagged.filter((id) => id !== question.id) : [...attempt!.flagged, question.id],
    });
  }

  function performSubmit(auto = false) {
    if (!attempt || !exam) return;
    const current = exam.questions[attempt.currentIndex];
    const timed = current ? withCurrentQuestionTime(attempt, current.id) : attempt;
    const completed: ExamAttempt = { ...timed, submittedAt: new Date().toISOString(), autoSubmitted: auto || undefined };
    recordSubmittedAttempt(completed);
    setAttempt(completed);
    router.replace(`/practice/${examId}/results`);
  }

  function askJace(action: "hint" | "explain" | "why_wrong") {
    openAskJace({
      action,
      context: {
        kind: "exam-question",
        label: `Question ${question.number} · ${exam!.title}`,
        text: `${question.prompt}\n${question.choices.map((choice) => `${choice.key}. ${choice.text}`).join("\n")}${answer ? `\n\nMy current answer: ${answer}` : ""}`,
        areaKey: question.areaKey,
        topicSlug: question.topicSlug,
      },
      message: action === "hint"
        ? "Give me one useful hint without revealing the final letter or complete answer."
        : action === "why_wrong"
          ? "Explain where my reasoning likely went wrong, then show the correct approach step by step."
          : "Help me reason through this question step by step before giving the final result.",
    });
  }

  return (
    <div data-exam-run data-exam-mode={mode} className={`${styles.run} ${isSimulation ? styles.simulation : styles.practice}`}>
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span>{isSimulation ? "SIMULATION" : "PRACTICE"}</span>
          <b>{exam.title}</b>
          {isSimulation && block && <small>{block.shortLabel} · {CELE_SIMULATION_STANDARD.effectiveFrom}</small>}
        </div>
        <div className={styles.clockGroup}>
          <small>Saved locally</small>
          <strong className={isSimulation && remaining <= 900 ? styles.urgent : ""}>
            {formatClock(isSimulation ? remaining : elapsed)}
          </strong>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.navigator} aria-label="Question navigator">
          <div className={styles.navigatorHead}>
            <b>Questions</b>
            <span>{answeredCount}/{exam.questions.length}</span>
          </div>
          <div className={styles.navigatorGrid}>
            {exam.questions.map((item, index) => {
              const hasAnswer = Boolean(attempt.answers[item.id]);
              const isFlagged = attempt.flagged.includes(item.id);
              const isCurrent = index === attempt.currentIndex;
              return (
                <button
                  key={item.id}
                  aria-label={`Question ${index + 1}${hasAnswer ? ", answered" : ", unanswered"}${isFlagged ? ", flagged" : ""}`}
                  className={`${hasAnswer ? styles.navAnswered : ""} ${isCurrent ? styles.navCurrent : ""} ${isFlagged ? styles.navFlagged : ""}`}
                  onClick={() => go(index)}
                >
                  {index + 1}{isFlagged && <sup>⚑</sup>}
                </button>
              );
            })}
          </div>
        </aside>

        <main className={styles.questionPane}>
          <div className={styles.qMeta}>
            <span>Question {attempt.currentIndex + 1} of {exam.questions.length}{question.areaKey ? ` · ${question.areaKey.toUpperCase()}` : ""}</span>
            <button onClick={toggleFlag}><FlagIcon />{flagged ? "Flagged" : "Flag"}</button>
          </div>

          <h1>{question.prompt}</h1>
          {question.sourcePage && <p className={styles.sourceLine}>Source page {question.sourcePage}</p>}

          <div className={styles.choices}>
            {question.choices.map((choice) => {
              const selected = answer === choice.key;
              const keyed = feedback && question.correctKey === choice.key;
              const wrongSelected = feedback && selected && !keyed;
              return (
                <button
                  key={choice.key}
                  className={`${selected ? styles.chosen : ""} ${keyed ? styles.right : ""} ${wrongSelected ? styles.wrong : ""}`}
                  onClick={() => chooseAnswer(choice.key)}
                >
                  <span>{choice.key}</span>
                  <p>{choice.text}</p>
                </button>
              );
            })}
          </div>

          {!isSimulation && question.correctKey && !feedback && (
            <button className={styles.check} disabled={!answer} onClick={() => setChecked((value) => ({ ...value, [question.id]: true }))}>
              Check answer
            </button>
          )}

          {!isSimulation && feedback && (
            <section className={`${styles.feedback} ${correct ? styles.feedbackCorrect : styles.feedbackWrong}`}>
              <small>{correct ? "CORRECT" : "NOT QUITE"}</small>
              <h2>{correct ? "Good work." : `The keyed answer is ${question.correctKey}.`}</h2>
              <p>{question.explanation || (correct
                ? "Keep the method in mind and move on when you're ready."
                : "Compare the keyed choice with your setup. If the missed step is not obvious, ask Jace for a hint or a full reasoning walkthrough.")}</p>
              {!correct && <div className={styles.feedbackActions}><button onClick={() => askJace("why_wrong")}>Why was mine wrong?</button><button onClick={() => askJace("explain")}>Show the approach</button></div>}
            </section>
          )}

          {!isSimulation && (
            <section className={styles.jaceHelp}>
              <img src="/assets/jace/mini/chat.png" alt="" />
              <div><b>Need a nudge?</b><span>Jace knows which question you're on.</span></div>
              <button onClick={() => askJace(answer ? "explain" : "hint")}>{answer ? "Ask Jace" : "Get a hint"}</button>
            </section>
          )}
        </main>

        <aside className={styles.sessionPane}>
          <div>
            <small>SESSION</small>
            <b>{attempt.currentIndex + 1} / {exam.questions.length}</b>
          </div>
          {isSimulation && <div><small>TIME LEFT</small><b>{formatClock(remaining)}</b></div>}
          <div><small>ANSWERED</small><b>{answeredCount}</b></div>
          <div><small>FLAGGED</small><b>{attempt.flagged.length}</b></div>
          {isSimulation && <button onClick={() => setHidden(true)}>Hide exam</button>}
          <button onClick={() => setSheet(true)}><GridIcon /> Answer sheet</button>
        </aside>
      </div>

      <footer className={styles.footer}>
        <button disabled={attempt.currentIndex === 0} onClick={() => go(attempt.currentIndex - 1)}>Previous</button>
        <button className={styles.sheetButton} onClick={() => setSheet(true)}><GridIcon /> Sheet</button>
        {attempt.currentIndex < exam.questions.length - 1
          ? <button className={styles.next} onClick={() => go(attempt.currentIndex + 1)}>Next</button>
          : <button className={styles.next} onClick={() => setReviewSubmit(true)}>Review & submit</button>}
      </footer>

      {sheet && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Answer sheet">
          <section className={styles.sheet}>
            <header><div><small>ANSWER SHEET</small><h2>{answeredCount} answered · {unanswered.length} blank</h2></div><button onClick={() => setSheet(false)}>Done</button></header>
            <div className={styles.legend}><span>● Answered</span><span>⚑ Flagged</span><span>— Blank</span></div>
            <div className={styles.sheetGrid}>
              {exam.questions.map((item, index) => {
                const value = attempt.answers[item.id];
                const isFlagged = attempt.flagged.includes(item.id);
                return (
                  <button key={item.id} onClick={() => go(index)} className={`${value ? styles.sheetAnswered : ""} ${index === attempt.currentIndex ? styles.sheetCurrent : ""}`}>
                    <b>{index + 1}{isFlagged && <sup>⚑</sup>}</b><small>{value || "—"}</small>
                  </button>
                );
              })}
            </div>
            <button className={styles.reviewButton} onClick={() => { setSheet(false); setReviewSubmit(true); }}>Review submission</button>
          </section>
        </div>
      )}

      {reviewSubmit && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Review submission">
          <section className={styles.submitSheet}>
            <small>BEFORE YOU SUBMIT</small>
            <h2>{unanswered.length ? `${unanswered.length} unanswered question${unanswered.length === 1 ? "" : "s"}.` : "Every question has an answer."}</h2>
            <div className={styles.submitStats}><span><b>{answeredCount}</b>Answered</span><span><b>{unanswered.length}</b>Blank</span><span><b>{attempt.flagged.length}</b>Flagged</span></div>
            {unanswered.length > 0 && <p>Unanswered: {unanswered.slice(0, 14).map((item) => item.number).join(", ")}{unanswered.length > 14 ? "…" : ""}</p>}
            <div className={styles.submitActions}><button onClick={() => { setReviewSubmit(false); setSheet(true); }}>Review answer sheet</button><button onClick={() => performSubmit(false)}>Submit {isSimulation ? "simulation" : "practice"}</button></div>
          </section>
        </div>
      )}

      {hidden && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Simulation hidden">
          <section className={styles.hiddenPanel}>
            <small>SIMULATION HIDDEN</small>
            <h2>Your timer is still running.</h2>
            <strong>{formatClock(remaining)}</strong>
            <p>Your answers stay saved locally while the paper is hidden.</p>
            <button onClick={() => setHidden(false)}>Return to exam</button>
          </section>
        </div>
      )}
    </div>
  );
}
