"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { getAdaptivePriorities, loadAdaptivePlan, type AdaptivePriority, type AdaptivePlan } from "@/lib/adaptive";
import { getStableDailyMessage, shouldWelcomeAfterRest, emitJaceReaction } from "@/lib/jace-personality";
import { daysUntil, loadSetup, type Setup } from "@/lib/onboarding";
import { getLocalProfile } from "@/lib/profile-store";
import { getProgressSnapshot, loadTomorrowPlan, type TomorrowPlan } from "@/lib/progress";
import { areas } from "@/lib/curriculum";
import { lessons } from "@/lib/review-content";
import { loadJacePreferences } from "@/lib/jace-preferences";
import styles from "./today.module.css";

function dayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function formatStudyTime(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function Today() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [name, setName] = useState("Kean");
  const [plan, setPlan] = useState<TomorrowPlan | null>(null);
  const [adaptivePlan, setAdaptivePlan] = useState<AdaptivePlan | null>(null);
  const [priorities, setPriorities] = useState<AdaptivePriority[]>([]);
  const [message, setMessage] = useState("");
  const [dailyMessageEnabled, setDailyMessageEnabled] = useState(true);
  const [week, setWeek] = useState({ activeDays: 0, answered: 0, totalSeconds: 0 });

  useEffect(() => {
    const current = loadSetup();
    setSetup(current);
    setPlan(loadTomorrowPlan());
    setAdaptivePlan(loadAdaptivePlan());
    setPriorities(getAdaptivePriorities());
    setMessage(getStableDailyMessage(current));
    setDailyMessageEnabled(loadJacePreferences().dailyMessagesEnabled);
    const progress = getProgressSnapshot();
    setWeek({ activeDays: progress.activeDays, answered: progress.answered, totalSeconds: progress.totalSeconds });
    getLocalProfile().then(profile => { if (profile?.displayName) setName(profile.displayName); }).catch(() => {});
    if (shouldWelcomeAfterRest(current)) {
      window.setTimeout(() => emitJaceReaction("return-after-rest", { reactionKey: `return-rest:${new Date().toDateString()}` }), 650);
    }
  }, []);

  const review = useMemo(() => {
    const planned = plan?.items[0];
    if (planned) {
      const area = areas.find(a => a.key === planned.areaKey);
      const topic = planned.topicSlug ? area?.topics.find(t => t.slug === planned.topicSlug) : undefined;
      return {
        title: planned.title,
        subtitle: area?.short || "CELE review",
        minutes: planned.minutes,
        href: topic?.lessonSlug ? `/review/lesson/${topic.lessonSlug}` : planned.topicSlug ? `/review/topic/${planned.areaKey}/${planned.topicSlug}` : "/review",
      };
    }
    const queued = adaptivePlan?.items.find(item => item.status !== "done");
    if (queued) {
      const topic = areas.find(a => a.key === queued.areaKey)?.topics.find(t => t.slug === queued.topicSlug);
      return {
        title: queued.topicName,
        subtitle: areas.find(a => a.key === queued.areaKey)?.short || "CELE review",
        minutes: queued.minutes,
        href: topic?.lessonSlug ? `/review/lesson/${topic.lessonSlug}` : `/review/topic/${queued.areaKey}/${queued.topicSlug}`,
      };
    }
    const withLesson = priorities.find(p => areas.find(a => a.key === p.areaKey)?.topics.find(t => t.slug === p.topicSlug)?.lessonSlug);
    const topic = withLesson ? areas.find(a => a.key === withLesson.areaKey)?.topics.find(t => t.slug === withLesson.topicSlug) : undefined;
    const lesson = topic?.lessonSlug ? lessons.find(l => l.slug === topic.lessonSlug) : lessons[0];
    return {
      title: lesson?.title || "Choose a topic",
      subtitle: withLesson?.areaShort || "CELE review",
      minutes: 20,
      href: lesson ? `/review/lesson/${lesson.slug}` : "/review",
    };
  }, [plan, adaptivePlan, priorities]);

  if (!setup) return null;
  const restDay = setup.restDays.includes(new Date().getDay());
  const exactDays = daysUntil(setup.targetExamDate);
  const countdownLabel = exactDays === null ? setup.targetExamPeriod : exactDays === 0 ? "CELE day" : exactDays > 0 ? "days to CELE" : "target passed";
  const nextItems = [
    ...(plan?.items.slice(1, 3).map(item => ({ title: item.title, meta: `${item.minutes} min · ${item.reason}` })) || []),
    ...priorities.slice(0, 3).map(item => ({ title: item.topicName, meta: `${item.areaShort} · ${item.dueLabel}` })),
  ].filter((item, index, all) => all.findIndex(other => other.title === item.title) === index).slice(0, 3);

  return <div className={styles.page}>
    <section className={styles.intro}>
      <p className={styles.date}>{formatDate()}</p>
      <h1>{dayGreeting()}, {name}.</h1>
      <p className={`${styles.encouragement} kih-editorial`}>You don&apos;t have to finish everything today.<br/>Just move one thing forward, my love.</p>
    </section>

    <section className={styles.countdown} aria-label="CELE countdown">
      <div>
        <span>CELE</span>
        <strong>{exactDays === null ? setup.targetExamPeriod : Math.max(0, exactDays)}</strong>
        <p>{countdownLabel}</p>
      </div>
      <div className={styles.timeline} aria-hidden="true"><i/><span/></div>
      {exactDays !== null && <small>{setup.targetExamPeriod}</small>}
    </section>

    {restDay ? <section className={styles.rest}>
      <div><small>TODAY</small><h2>Rest day</h2><p>Nothing is due today. Your progress is safe.</p><Link href="/review">Browse Review</Link></div>
      <JaceSticker mood="rest" size={116}/>
    </section> : <section className={styles.todayReview}>
      <div className={styles.sectionLabel}>TODAY&apos;S REVIEW</div>
      <div className={styles.reviewBody}>
        <div><span>{review.subtitle}</span><h2>{review.title}</h2><p>Continue where you left off. About {review.minutes} min.</p></div>
        <Link href={review.href}>Continue review <span aria-hidden="true">→</span></Link>
      </div>
    </section>}

    {!restDay && nextItems.length > 0 && <section className={styles.upNext}>
      <div className={styles.sectionLabel}>UP NEXT</div>
      <div className={styles.list}>{nextItems.map(item => <div key={item.title} className={styles.row}><span className={styles.dot}/><div><b>{item.title}</b><small>{item.meta}</small></div></div>)}</div>
    </section>}

    {dailyMessageEnabled && <section className={styles.message}>
      <div className={styles.messageHead}><span>FROM JACE</span><JaceSticker mood="gentle" size={72}/></div>
      <blockquote className="kih-editorial">{message || "Small progress still counts. Especially the kind nobody else sees."}</blockquote>
      <small>— Jace</small>
    </section>}

    <section className={styles.week}>
      <div className={styles.sectionLabel}>YOUR STUDY SO FAR</div>
      <div className={styles.weekStats}>
        <div><strong>{week.activeDays}</strong><span>active days</span></div>
        <div><strong>{formatStudyTime(week.totalSeconds)}</strong><span>recorded practice</span></div>
        <div><strong>{week.answered}</strong><span>questions answered</span></div>
      </div>
      <Link href="/progress">View progress →</Link>
    </section>
  </div>;
}
