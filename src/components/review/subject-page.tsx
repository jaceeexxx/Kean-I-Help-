"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Area } from "@/lib/curriculum";
import { getProgressSnapshot, type Metric } from "@/lib/progress";
import { getTopicStatus, statusTone } from "@/lib/review-status";
import styles from "./subject-page.module.css";

export function SubjectPage({ area }: { area: Area }) {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});
  useEffect(() => {
    const snapshot = getProgressSnapshot();
    setMetrics(Object.fromEntries(snapshot.topics.filter(topic => topic.areaKey === area.key).map(topic => [topic.topicSlug, topic.metric])));
  }, [area.key]);

  return <div className={styles.page}>
    <Link href="/review" className={styles.back}>← Review</Link>
    <section className={styles.heading}>
      <div><p>{area.weight}% OF CELE</p><h1>{area.name}</h1><span>{area.topics.length} official topic groups</span></div>
      <div className={styles.weight}><strong>{area.weight}</strong><small>percent</small></div>
    </section>

    <section className={styles.topics}>
      <div className={styles.sectionTitle}><span>TOPICS</span><small>Status appears only from actual practice evidence.</small></div>
      <div className={styles.topicList}>{area.topics.map((topic, index) => {
        const status = getTopicStatus(metrics[topic.slug]);
        const metric = metrics[topic.slug];
        return <Link key={topic.slug} href={`/review/topic/${area.key}/${topic.slug}`} className={styles.topicRow}>
          <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
          <div><b>{topic.name}</b><span>{topic.lessonSlug ? "Guided lesson available" : metric?.attempted ? `${metric.attempted} answered questions` : "Ready for materials and practice"}</span></div>
          <small data-tone={statusTone(status)}>{status}</small>
          <strong aria-hidden="true">›</strong>
        </Link>;
      })}</div>
    </section>
  </div>;
}
