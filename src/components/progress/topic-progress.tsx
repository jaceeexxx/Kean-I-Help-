"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { openAskJace } from "@/lib/ask-jace-client";
import { getTopicProgress, type TopicProgress as TopicProgressData } from "@/lib/progress";
import { getTopicStatus } from "@/lib/review-status";
import type { AreaKey } from "@/lib/curriculum";
import styles from "./topic-progress.module.css";

export function TopicProgress({ areaKey, areaShort, areaWeight, topicSlug, topicName }: { areaKey: AreaKey; areaShort: string; areaWeight: number; topicSlug: string; topicName: string }) {
  const [data, setData] = useState<ReturnType<typeof getTopicProgress> | null>(null);
  useEffect(() => { setData(getTopicProgress(areaKey, topicSlug)); }, [areaKey, topicSlug]);
  if (!data) return <div className={styles.loading}>Loading topic evidence…</div>;
  const topicData = data;
  const metric = data.topic?.metric;
  const status = getTopicStatus(metric);
  const enough = Boolean(metric && metric.keyedAttempted >= 8);

  function askJace() {
    openAskJace({
      action: "study_next",
      context: {
        kind: "progress",
        label: `${topicName} progress`,
        text: `${areaShort} (${areaWeight}% of CELE)\nTopic: ${topicName}\nStatus: ${status}\nKeyed questions: ${metric?.keyedAttempted || 0}\nAccuracy: ${metric?.keyedAttempted ? `${metric.accuracy}%` : "not measured"}\nAverage question time: ${metric?.avgSeconds || 0}s\nRecent misses: ${topicData.mistakes.length}`,
        areaKey,
        topicSlug,
      },
      message: "Explain what the evidence says I should fix next in this topic. Do not overstate confidence if the sample is small.",
    });
  }

  return <div className={styles.page}>
    <Link href="/progress" className={styles.back}>← Progress</Link>
    <header className={styles.hero}>
      <span>{areaShort} · {areaWeight}% of CELE</span>
      <h1>{topicName}</h1>
      <p className={styles.status}>{status}</p>
    </header>

    {!metric || metric.attempted === 0 ? <section className={styles.empty}>
      <h2>No question evidence yet.</h2>
      <p>Practice this topic first. Kean I Help? will wait for real answers before deciding whether it needs work.</p>
      <Link href={`/practice?area=${areaKey}&topic=${topicSlug}`}>Practice this topic</Link>
    </section> : <>
      <section className={styles.metrics}>
        <div><strong>{metric.keyedAttempted ? `${metric.accuracy}%` : "—"}</strong><span>keyed accuracy</span></div>
        <div><strong>{metric.keyedAttempted}</strong><span>keyed questions</span></div>
        <div><strong>{metric.avgSeconds}s</strong><span>average/question</span></div>
        <div><strong>{metric.incorrect}</strong><span>recorded misses</span></div>
      </section>

      <section className={styles.interpretation}>
        <span>WHAT THE EVIDENCE MEANS</span>
        <h2>{enough ? interpretation(metric.accuracy, metric.avgSeconds) : "Still collecting evidence."}</h2>
        <p>{enough ? detail(metric.accuracy, metric.avgSeconds) : `There are ${metric.keyedAttempted} keyed questions for this topic. We wait until at least 8 before treating the result as a meaningful topic signal.`}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><span>RECENT ATTEMPTS</span><h2>How this topic has been going</h2></div>
        {data.attempts.length ? <div className={styles.attempts}>{data.attempts.slice(0, 8).map((attempt) => <Link href={`/practice/${attempt.examId}/results`} key={attempt.attemptId}>
          <time>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(attempt.date))}</time>
          <span><b>{attempt.title}</b><small>{attempt.attempted} questions · {attempt.avgSeconds}s avg</small></span>
          <strong>{attempt.accuracy === null ? "—" : `${attempt.accuracy}%`}</strong>
        </Link>)}</div> : <p className={styles.muted}>No matching attempts yet.</p>}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><span>RECENT MISSES</span><h2>{data.mistakes.length ? `${data.mistakes.length} recent items` : "No recent keyed misses"}</h2></div>
        {data.mistakes.length ? <div className={styles.misses}>{data.mistakes.slice(0, 6).map((mistake) => <article key={`${mistake.attemptId}:${mistake.questionId}`}>
          <small>Question {mistake.questionNumber} · {mistake.examTitle}</small>
          <p>{mistake.prompt}</p>
          <span>You chose {mistake.selected || "—"} · Key {mistake.correctKey} · {mistake.seconds}s</span>
        </article>)}</div> : <p className={styles.muted}>Nothing to replay from recent stored attempts.</p>}
      </section>
    </>}

    <section className={styles.actions}>
      <Link href={`/practice?area=${areaKey}&topic=${topicSlug}`}>Practice 10 questions</Link>
      <Link className={styles.secondary} href={`/review/topic/${areaKey}/${topicSlug}`}>Review the topic</Link>
      <button onClick={askJace}>Ask Jace about this evidence</button>
    </section>
  </div>;
}

function interpretation(accuracy: number, avgSeconds: number) {
  if (accuracy < 60 && avgSeconds > 120) return "Accuracy and pace both need attention.";
  if (accuracy < 60) return "The main problem is accuracy, not speed.";
  if (avgSeconds > 120 && accuracy >= 80) return "You know it; now make it faster.";
  if (accuracy >= 85) return "This is becoming a dependable topic.";
  return "The foundation is there, but it still needs repetition.";
}

function detail(accuracy: number, avgSeconds: number) {
  if (accuracy < 60 && avgSeconds > 120) return `At ${accuracy}% accuracy and ${avgSeconds}s per answered question, slow down enough to repair the method first; speed work can come after the process is stable.`;
  if (accuracy < 60) return `At ${accuracy}% accuracy, more timed drilling would hide the real issue. Review the reasoning and retry recent misses before chasing pace.`;
  if (avgSeconds > 120 && accuracy >= 80) return `Accuracy is holding at ${accuracy}%, while the average is ${avgSeconds}s per question. Short speed drills may be more useful than another full lesson.`;
  if (accuracy >= 85) return `${accuracy}% accuracy is a strong signal when supported by enough keyed questions. Keep it active through spaced review rather than over-studying it.`;
  return `The current ${accuracy}% accuracy is useful but not yet stable enough to treat as a strength. Targeted practice can tighten it.`;
}
