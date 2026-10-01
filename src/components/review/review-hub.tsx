"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { areas } from "@/lib/curriculum";
import { getAdaptivePriorities, type AdaptivePriority } from "@/lib/adaptive";
import { lessons } from "@/lib/review-content";
import { getProgressSnapshot } from "@/lib/progress";
import { getTopicStatus } from "@/lib/review-status";
import { listLibrary } from "@/lib/library-service";
import type { LibraryItem } from "@/lib/library-types";
import { ReviewTabs } from "./review-tabs";
import styles from "./review-hub.module.css";

const areaIcon: Record<string, string> = {
  structural: "/assets/icons/subjects/structural.svg",
  mste: "/assets/icons/subjects/applied.svg",
  hge: "/assets/icons/subjects/hydraulics.svg",
};

export function ReviewHub() {
  const [search, setSearch] = useState("");
  const [priorities, setPriorities] = useState<AdaptivePriority[]>([]);
  const [topicMetrics, setTopicMetrics] = useState<Record<string, ReturnType<typeof getProgressSnapshot>["topics"][number]["metric"]>>({});
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    setPriorities(getAdaptivePriorities());
    const snapshot = getProgressSnapshot();
    setTopicMetrics(Object.fromEntries(snapshot.topics.map(topic => [`${topic.areaKey}:${topic.topicSlug}`, topic.metric])));
    listLibrary().then(setLibraryItems).catch(() => setLibraryItems([]));
  }, []);

  const recommended = useMemo(() => {
    for (const priority of priorities) {
      const area = areas.find(a => a.key === priority.areaKey);
      if (!area) continue;
      const topic = area.topics.find(t => t.slug === priority.topicSlug);
      if (topic?.lessonSlug) {
        const lesson = lessons.find(item => item.slug === topic.lessonSlug);
        if (lesson) return { priority, area, topic, lesson };
      }
    }
    const lesson = lessons[0];
    const area = areas.find(a => a.key === lesson.area)!;
    const topic = area.topics.find(t => t.slug === lesson.topicSlug)!;
    return { priority: null, area, topic, lesson };
  }, [priorities]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const topicResults = areas.flatMap(area => area.topics
      .filter(topic => `${topic.name} ${area.name} ${area.short}`.toLowerCase().includes(query))
      .map(topic => ({ type: "Topic" as const, title: topic.name, subtitle: area.name, href: `/review/topic/${area.key}/${topic.slug}` })));
    const lessonResults = lessons
      .filter(lesson => `${lesson.title} ${lesson.subtitle} ${lesson.concept.join(" ")}`.toLowerCase().includes(query))
      .map(lesson => ({ type: "Lesson" as const, title: lesson.title, subtitle: lesson.subtitle, href: `/review/lesson/${lesson.slug}` }));
    const materialResults = libraryItems
      .filter(item => `${item.title} ${item.fileName || ""} ${item.noteText || ""}`.toLowerCase().includes(query))
      .map(item => ({ type: item.category === "personal-note" ? "Note" as const : "Material" as const, title: item.title, subtitle: item.fileName || "Your Library", href: `/review/library/${item.id}` }));
    return [...topicResults, ...lessonResults, ...materialResults].slice(0, 14);
  }, [search, libraryItems]);

  return <div className={styles.page}>
    <section className={styles.heading}>
      <p>REVIEW</p>
      <h1>Your CELE workspace.</h1>
      <span>Everything you need to learn, revisit, and organize — in one place.</span>
    </section>

    <label className={styles.search}>
      <span aria-hidden="true">⌕</span>
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search topics and lessons, plus materials..." aria-label="Search Review"/>
      {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
    </label>

    <ReviewTabs/>

    {search.trim() ? <section className={styles.searchResults}>
      <div className={styles.sectionTitle}><span>SEARCH RESULTS</span><small>{results.length} shown</small></div>
      {results.length ? <div className={styles.resultList}>{results.map(result => <Link href={result.href} key={`${result.type}:${result.href}`}>
        <div><small>{result.type.toUpperCase()}</small><b>{result.title}</b><span>{result.subtitle}</span></div><strong>›</strong>
      </Link>)}</div> : <div className={styles.empty}>Nothing in Review matches “{search}”.</div>}
    </section> : <>
      <section className={styles.continueSection}>
        <div className={styles.sectionTitle}><span>CONTINUE</span></div>
        <Link href={`/review/lesson/${recommended.lesson.slug}`} className={styles.continueRow}>
          <div><small>{recommended.area.short}</small><h2>{recommended.lesson.title}</h2><p>{recommended.lesson.readMinutes} min · {recommended.priority?.reasons[0] || "A focused starter lesson"}</p></div>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className={styles.coverage}>
        <div className={styles.sectionTitle}><span>CELE COVERAGE</span><small>39 topic groups</small></div>
        <div className={styles.areaList}>{areas.map(area => {
          const metrics = area.topics.map(topic => topicMetrics[`${area.key}:${topic.slug}`]).filter(Boolean);
          const measured = metrics.filter(metric => metric.keyedAttempted > 0).length;
          return <Link href={`/review/subjects/${area.key}`} key={area.key} className={styles.areaRow}>
            <img src={areaIcon[area.key]} alt=""/>
            <div><b>{area.name}</b><span>{area.topics.length} topics · {measured ? `${measured} with practice evidence` : "start anywhere"}</span></div>
            <div className={styles.weight}><strong>{area.weight}%</strong><small>of CELE</small></div>
            <span className={styles.chevron}>›</span>
          </Link>;
        })}</div>
      </section>

      <section className={styles.topicPreview}>
        <div className={styles.sectionTitle}><span>RECENT FOCUS</span><small>Evidence, not a readiness score</small></div>
        <div className={styles.focusRows}>{priorities.slice(0, 4).map(priority => {
          const status = getTopicStatus(topicMetrics[`${priority.areaKey}:${priority.topicSlug}`]);
          return <Link key={`${priority.areaKey}:${priority.topicSlug}`} href={`/review/topic/${priority.areaKey}/${priority.topicSlug}`}>
            <div><b>{priority.topicName}</b><span>{priority.areaShort}</span></div><small>{status}</small>
          </Link>;
        })}</div>
      </section>
    </>}
  </div>;
}
