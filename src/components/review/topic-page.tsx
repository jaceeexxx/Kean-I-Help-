"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Area, Topic } from "@/lib/curriculum";
import { getProgressSnapshot, type Metric } from "@/lib/progress";
import { getTopicStatus, statusTone } from "@/lib/review-status";
import { getLesson } from "@/lib/review-content";
import { openAskJace } from "@/lib/ask-jace-client";
import styles from "./topic-page.module.css";

function formatSeconds(value: number) {
  if (!value) return "—";
  const minutes = Math.floor(value / 60), seconds = value % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function TopicPage({ area, topic }: { area: Area; topic: Topic }) {
  const [metric, setMetric] = useState<Metric | undefined>();
  useEffect(() => {
    const found = getProgressSnapshot().topics.find(item => item.areaKey === area.key && item.topicSlug === topic.slug);
    setMetric(found?.metric);
  }, [area.key, topic.slug]);
  const lesson = topic.lessonSlug ? getLesson(topic.lessonSlug) : undefined;
  const status = getTopicStatus(metric);

  return <div className={styles.page}>
    <Link href={`/review/subjects/${area.key}`} className={styles.back}>← {area.short}</Link>
    <section className={styles.heading}>
      <p>{area.name}</p>
      <div className={styles.titleRow}><h1>{topic.name}</h1><span data-tone={statusTone(status)}>{status}</span></div>
      <p className={styles.intro}>Keep lessons, practice evidence, and source materials for this topic together.</p>
    </section>

    <div className={styles.layout}>
      <main>
        <section className={styles.block}>
          <div className={styles.label}>OVERVIEW</div>
          <p>This topic is part of <b>{area.name}</b>, which carries {area.weight}% of the current CELE subject weighting in the app&apos;s curriculum map.</p>
        </section>

        <section className={styles.block}>
          <div className={styles.label}>LESSONS</div>
          {lesson ? <Link href={`/review/lesson/${lesson.slug}`} className={styles.lessonRow}>
            <div><small>{lesson.readMinutes} MIN READ</small><b>{lesson.title}</b><span>{lesson.subtitle}</span></div><strong>→</strong>
          </Link> : <div className={styles.empty}>No guided lesson has been authored for this topic yet. Your materials and practice can still be organized here.</div>}
        </section>

        <section className={styles.block}>
          <div className={styles.label}>YOUR MATERIALS</div>
          <div className={styles.materials}><p>Use Library to keep reviewers, past exams, and notes alongside this CELE workspace.</p><Link href="/review/library">Open Library →</Link></div>
        </section>

        <section className={styles.block}>
          <div className={styles.label}>PRACTICE EVIDENCE</div>
          {metric?.attempted ? <div className={styles.metrics}>
            <div><strong>{metric.attempted}</strong><span>answered</span></div>
            <div><strong>{metric.keyedAttempted ? `${metric.accuracy}%` : "—"}</strong><span>keyed accuracy</span></div>
            <div><strong>{formatSeconds(metric.avgSeconds)}</strong><span>avg / question</span></div>
          </div> : <div className={styles.empty}>No practice evidence yet. We&apos;ll wait for real attempts before calling this a strength or weakness.</div>}
        </section>
      </main>

      <aside className={styles.actions}>
        {lesson && <Link className={styles.primary} href={`/review/lesson/${lesson.slug}`}>Continue lesson</Link>}
        <Link className={styles.secondary} href="/practice">Practice this topic</Link>
        <button onClick={() => openAskJace({ action: "explain", context: { kind: "topic", label: topic.name, text: `CELE area: ${area.name}\nTopic: ${topic.name}`, areaKey: area.key, topicSlug: topic.slug }, message: `Help me understand ${topic.name} for CELE. Start with the core idea and what I should be able to solve.` })}>Ask Jace</button>
      </aside>
    </div>
  </div>;
}
