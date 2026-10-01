"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { getAdaptivePriorities, type AdaptivePriority } from "@/lib/adaptive";
import { openAskJace } from "@/lib/ask-jace-client";
import { emitJaceReaction } from "@/lib/jace-personality";
import { buildTomorrowPlan, getProgressSnapshot, loadTomorrowPlan, type ProgressSnapshot, type TomorrowPlan } from "@/lib/progress";
import { getTopicStatus } from "@/lib/review-status";
import styles from "./progress-dashboard.module.css";

function formatMinutes(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(value));
}

export function ProgressDashboard() {
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptivePriority[]>([]);
  const [plan, setPlan] = useState<TomorrowPlan | null>(null);

  useEffect(() => {
    setProgress(getProgressSnapshot());
    setAdaptive(getAdaptivePriorities());
    setPlan(loadTomorrowPlan());
  }, []);

  const focus = useMemo(() => {
    if (!progress) return null;
    return adaptive.find((item) => item.keyedAttempted >= 3) || adaptive.find((item) => item.attempted > 0) || null;
  }, [adaptive, progress]);

  if (!progress) return <div className={styles.loading}>Loading your study report…</div>;
  if (progress.attempts === 0) return <EmptyProgress />;

  const evidenceTopics = progress.topics.filter((topic) => topic.metric.keyedAttempted >= 3);
  const attention = evidenceTopics.slice(0, 5);

  function createTomorrowPlan() {
    const next = buildTomorrowPlan();
    setPlan(next);
    emitJaceReaction("plan-built", { reactionKey: `v2-plan:${new Date().toDateString()}` });
  }

  function askAboutProgress() {
    openAskJace({
      action: "study_next",
      context: {
        kind: "progress",
        label: "Kean's current CELE progress",
        text: [
          `Last 30 days: ${progress!.last30.attempts} sessions, ${progress!.last30.answered} answered, ${progress!.last30.accuracy ?? "not enough keyed data"}${progress!.last30.accuracy === null ? "" : "% accuracy"}.`,
          `Average active question time: ${progress!.avgSecondsPerQuestion ?? "not measured"} seconds.`,
          `Recent recurring misses: ${progress!.mistakes.topics.slice(0, 4).map((item) => `${item.topicName} (${item.misses})`).join(", ") || "none yet"}.`,
          focus ? `Current evidence-based focus: ${focus.topicName}. ${focus.reasons.join("; ")}.` : "There is not enough evidence for a current focus yet.",
        ].join("\n"),
      },
      message: "Explain the most useful next study move from this evidence. Keep it practical, specific, and short.",
    });
  }

  return <div className={styles.page}>
    <section className={styles.intro}>
      <div><span className={styles.eyebrow}>PROGRESS</span><h1>Your work is starting to tell a story.</h1></div>
      <p>This report uses submitted questions, timing, misses, and CELE coverage. No readiness score, no made-up confidence.</p>
    </section>

    <section className={styles.month} aria-label="Last 30 days">
      <div className={styles.monthLead}>
        <span>LAST 30 DAYS</span>
        <strong>{progress.last30.activeDays}</strong>
        <small>active study days</small>
      </div>
      <div className={styles.monthMetric}><b>{progress.last30.answered}</b><span>questions answered</span></div>
      <div className={styles.monthMetric}><b>{formatMinutes(progress.last30.activeQuestionSeconds)}</b><span>active question time</span></div>
      <div className={styles.monthMetric}><b>{progress.last30.accuracy === null ? "—" : `${progress.last30.accuracy}%`}</b><span>keyed accuracy</span></div>
    </section>

    <section className={styles.focus}>
      <div className={styles.sectionHeading}><span>CURRENT FOCUS</span><h2>{focus ? focus.topicName : "Keep collecting evidence"}</h2></div>
      {focus ? <>
        <p>{focus.reasons.slice(0, 2).join(" · ")}</p>
        <div className={styles.focusMeta}><span>{focus.areaShort}</span><span>{focus.areaWeight}% of CELE</span><span>{focus.dueLabel}</span></div>
        <div className={styles.actions}><Link href={`/progress/topics/${focus.areaKey}/${focus.topicSlug}`}>See topic evidence</Link><Link className={styles.secondary} href={`/practice?area=${focus.areaKey}&topic=${focus.topicSlug}`}>Practice this topic</Link></div>
      </> : <><p>You do not have enough trusted question history yet for a reliable topic recommendation. Keep practicing and this section will become specific.</p><Link className={styles.primaryLink} href="/practice">Start a practice set</Link></>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>CELE AREAS</span><h2>Performance by official exam area</h2></div>
      <div className={styles.areaList}>{progress.areas.map((area) => <article key={area.key} className={styles.areaRow}>
        <div className={styles.areaCopy}><div><b>{area.short}</b><span>{area.weight}% of CELE</span></div><p>{area.name}</p></div>
        <div className={styles.areaEvidence}><strong>{area.metric.keyedAttempted ? `${area.metric.accuracy}%` : "—"}</strong><small>{area.metric.keyedAttempted ? `${area.metric.keyedAttempted} keyed` : `${area.metric.attempted} answered`} · {area.metric.avgSeconds || 0}s avg</small></div>
        <div className={styles.meter} aria-hidden="true"><i style={{ width: `${area.metric.keyedAttempted ? area.metric.accuracy : 0}%` }} /></div>
      </article>)}</div>
      <p className={styles.note}>The 35 / 35 / 30 labels are PRC exam weights. They are not readiness scores.</p>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>NEEDS ATTENTION</span><h2>Topics with enough evidence to act on</h2></div>
      {attention.length ? <div className={styles.topicList}>{attention.map((topic) => {
        const status = getTopicStatus(topic.metric);
        return <Link href={`/progress/topics/${topic.areaKey}/${topic.topicSlug}`} key={`${topic.areaKey}:${topic.topicSlug}`}>
          <div><b>{topic.name}</b><span>{status} · {topic.metric.keyedAttempted} keyed questions</span></div>
          <div className={styles.topicRight}><strong>{topic.metric.accuracy}%</strong><small>{topic.metric.avgSeconds}s avg</small></div>
        </Link>;
      })}</div> : <p className={styles.emptyText}>We will wait for more keyed practice before labeling a topic as strong or weak.</p>}
    </section>

    <section className={styles.timing}>
      <div className={styles.sectionHeading}><span>QUESTION TIMING</span><h2>Accuracy and pace are different problems.</h2></div>
      <p>For this report, “slow” means more than {progress.timing.thresholdSeconds} seconds on an answered, keyed question. It is a study signal—not a PRC rule.</p>
      <div className={styles.timingGrid}>
        <div><b>{progress.timing.fastCorrect}</b><span>faster + correct</span></div>
        <div><b>{progress.timing.slowCorrect}</b><span>slower + correct</span></div>
        <div><b>{progress.timing.fastIncorrect}</b><span>faster + incorrect</span></div>
        <div><b>{progress.timing.slowIncorrect}</b><span>slower + incorrect</span></div>
      </div>
    </section>

    <section className={styles.split}>
      <div className={styles.section}>
        <div className={styles.sectionHeading}><span>MISTAKES</span><h2>{progress.mistakes.total ? `${progress.mistakes.total} misses worth revisiting` : "Nothing to replay yet"}</h2></div>
        {progress.mistakes.topics.length ? <div className={styles.mistakeTopics}>{progress.mistakes.topics.slice(0, 4).map((item) => <div key={`${item.areaKey}:${item.topicSlug}`}><span><b>{item.topicName}</b><small>{item.misses} miss{item.misses === 1 ? "" : "es"}</small></span>{item.areaKey && item.topicSlug ? <Link href={`/progress/topics/${item.areaKey}/${item.topicSlug}`}>Review →</Link> : null}</div>)}</div> : <p className={styles.emptyText}>Submit answer-keyed practice and repeated misses will appear here.</p>}
        <Link className={styles.quietLink} href="/progress/mistakes">Open mistakes</Link>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeading}><span>RECENT SIMULATION</span><h2>{progress.simulations[0]?.title || "No simulation yet"}</h2></div>
        {progress.simulations[0] ? <div className={styles.simulationSummary}><strong>{progress.simulations[0].score === null ? "—" : `${progress.simulations[0].score}%`}</strong><p>{progress.simulations[0].blockLabel} · {progress.simulations[0].standard}</p><small>{progress.simulations[0].answered}/{progress.simulations[0].total} answered · {formatMinutes(progress.simulations[0].durationSeconds)}</small></div> : <p className={styles.emptyText}>When you complete a timed simulation, its PRC block and timing context will stay attached to the result.</p>}
        <Link className={styles.quietLink} href="/progress/history">Open history</Link>
      </div>
    </section>

    <section className={styles.plan}>
      <div className={styles.planHead}><div><span>TOMORROW</span><h2>{plan ? `${plan.totalMinutes} focused minutes` : "Build tomorrow's review"}</h2></div><JaceSticker mood="thinking" size={92} /></div>
      <p>Use actual misses and lower-confidence evidence to prepare a short review. You can still ignore or change it tomorrow.</p>
      {plan && <div className={styles.planItems}>{plan.items.map((item, index) => <div key={`${item.title}:${index}`}><b>{item.minutes}m</b><span><strong>{item.title}</strong><small>{item.reason}</small></span></div>)}</div>}
      <div className={styles.planActions}><button onClick={createTomorrowPlan}>{plan ? "Rebuild plan" : "Build plan"}</button><button className={styles.jaceButton} onClick={askAboutProgress}>Ask Jace about my progress</button></div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><span>RECENT HISTORY</span><h2>Your latest study sessions</h2></div>
      <div className={styles.history}>{progress.history.slice(0, 5).map((item) => <Link href={item.href} key={item.id}><time>{dateLabel(item.date)}</time><span><b>{item.title}</b><small>{item.subtitle}</small></span><strong>{item.score === null ? "—" : `${item.score}%`}</strong></Link>)}</div>
      <Link className={styles.quietLink} href="/progress/history">View full history</Link>
    </section>
  </div>;
}

function EmptyProgress() {
  return <div className={styles.emptyState}>
    <img src="/assets/illustrations/no-progress.svg" width="170" height="130" alt="" aria-hidden="true" />
    <span>PROGRESS</span>
    <h1>Nothing to measure yet.</h1>
    <p>Complete a lesson or submit a practice set and your study history will begin here. We will wait for enough evidence before calling anything a strength or weakness.</p>
    <Link href="/practice">Start with Practice</Link>
  </div>;
}
