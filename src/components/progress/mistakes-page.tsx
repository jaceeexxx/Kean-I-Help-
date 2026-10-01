"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { openAskJace } from "@/lib/ask-jace-client";
import { getProgressSnapshot, type ProgressSnapshot } from "@/lib/progress";
import styles from "./mistakes-page.module.css";

export function MistakesPage() {
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  useEffect(() => setProgress(getProgressSnapshot()), []);
  if (!progress) return <div className={styles.loading}>Loading mistakes…</div>;

  function ask(mistake: ProgressSnapshot["mistakes"]["recent"][number]) {
    openAskJace({
      action: "why_wrong",
      context: {
        kind: "exam-question",
        label: `Question ${mistake.questionNumber} · ${mistake.examTitle}`,
        text: `${mistake.prompt}\n${mistake.choices.map((choice) => `${choice.key}. ${choice.text}`).join("\n")}\n\nLearner answer: ${mistake.selected || "Unanswered"}\nKeyed answer: ${mistake.correctKey}`,
        areaKey: mistake.areaKey,
        topicSlug: mistake.topicSlug,
      },
      message: "Show me where my reasoning likely went wrong, then give me one clue to notice next time before showing a full solution.",
    });
  }

  return <div className={styles.page}>
    <Link href="/progress" className={styles.back}>← Progress</Link>
    <header className={styles.hero}><span>MISTAKES</span><h1>Misses are useful when they come back better.</h1><p>This list only uses questions with a trusted answer key. A corrected retry does not instantly turn the whole topic into a strength.</p></header>

    <section className={styles.summary}>
      <div><strong>{progress.mistakes.total}</strong><span>recorded misses</span></div>
      <div><strong>{progress.mistakes.topics.length}</strong><span>topics affected</span></div>
      <div><strong>{progress.mistakes.topics[0]?.topicName || "—"}</strong><span>most repeated</span></div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>REPEATED PATTERNS</span><h2>Where mistakes cluster</h2></div>
      {progress.mistakes.topics.length ? <div className={styles.patterns}>{progress.mistakes.topics.map((topic) => <div key={`${topic.areaKey}:${topic.topicSlug}`}>
        <span><b>{topic.topicName}</b><small>{topic.misses} miss{topic.misses === 1 ? "" : "es"} · last seen {new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(topic.latestAt))}</small></span>
        {topic.areaKey && topic.topicSlug ? <Link href={`/progress/topics/${topic.areaKey}/${topic.topicSlug}`}>Evidence →</Link> : null}
      </div>)}</div> : <p className={styles.empty}>No keyed misses yet. That is either good news or simply too early to tell.</p>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>RECENT ITEMS</span><h2>Review the actual questions</h2></div>
      {progress.mistakes.recent.length ? <div className={styles.questions}>{progress.mistakes.recent.map((mistake) => <article key={`${mistake.attemptId}:${mistake.questionId}`}>
        <header><span>Q{mistake.questionNumber} · {mistake.topicName || mistake.areaKey?.toUpperCase() || "Untagged"}</span><time>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(mistake.submittedAt))}</time></header>
        <p>{mistake.prompt}</p>
        <div className={styles.answerLine}><span>You chose <b>{mistake.selected || "—"}</b></span><span>Key <b>{mistake.correctKey}</b></span><span>{mistake.seconds}s</span></div>
        <footer><Link href={`/practice/${mistake.examId}/results`}>Open result</Link><button onClick={() => ask(mistake)}>Ask Jace why</button></footer>
      </article>)}</div> : <p className={styles.empty}>Nothing to review yet.</p>}
    </section>

    <Link className={styles.practice} href="/practice">Start another practice set</Link>
  </div>;
}
