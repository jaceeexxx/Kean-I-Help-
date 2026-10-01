"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProgressSnapshot, type ProgressSnapshot } from "@/lib/progress";
import styles from "./history-page.module.css";

export function HistoryPage() {
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  useEffect(() => setProgress(getProgressSnapshot()), []);
  const calendar = useMemo(() => buildCalendar(progress?.history.map((item) => item.date) || []), [progress]);
  if (!progress) return <div className={styles.loading}>Loading history…</div>;

  return <div className={styles.page}>
    <Link href="/progress" className={styles.back}>← Progress</Link>
    <header className={styles.hero}><span>HISTORY</span><h1>Your study record, without the guilt mechanics.</h1><p>Study days, practice sessions, and simulations stay visible here. A missed day is simply a missed day—not a broken identity.</p></header>

    <section className={styles.calendarSection}>
      <div className={styles.sectionHead}><span>LAST 35 DAYS</span><h2>Study rhythm</h2></div>
      <div className={styles.calendar} aria-label="Study activity calendar">{calendar.map((day) => <div key={day.key} className={day.active ? styles.active : ""} title={`${day.label}${day.active ? " · study activity" : ""}`}><span>{day.day}</span></div>)}</div>
      <div className={styles.legend}><span><i className={styles.activeDot}/>Study activity</span><span><i/>No recorded activity</span></div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>SIMULATIONS</span><h2>Timed exam history</h2></div>
      {progress.simulations.length ? <div className={styles.simulations}>{progress.simulations.map((item) => <Link href={`/practice/${item.attempt.examId}/results`} key={item.attempt.id}>
        <div><time>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(item.attempt.submittedAt || item.attempt.startedAt))}</time><b>{item.title}</b><small>{item.blockLabel} · {item.standard}</small></div>
        <div className={styles.simRight}><strong>{item.score === null ? "—" : `${item.score}%`}</strong><small>{item.answered}/{item.total} answered · {formatDuration(item.durationSeconds)}</small></div>
      </Link>)}</div> : <p className={styles.empty}>No completed simulation yet.</p>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>ALL SESSIONS</span><h2>Practice and simulation timeline</h2></div>
      {progress.history.length ? <div className={styles.timeline}>{progress.history.map((item) => <Link href={item.href} key={item.id}>
        <time>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(item.date))}</time>
        <span><b>{item.title}</b><small>{item.subtitle}</small></span>
        <strong>{item.score === null ? "—" : `${item.score}%`}</strong>
      </Link>)}</div> : <p className={styles.empty}>Your first submitted practice set will appear here.</p>}
    </section>
  </div>;
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return `${hours}h${rest ? ` ${rest}m` : ""}`;
}

function buildCalendar(values: string[]) {
  const active = new Set(values.map((value) => value.slice(0, 10)));
  const today = new Date();
  const days: { key: string; label: string; day: number; active: boolean }[] = [];
  for (let offset = 34; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    days.push({ key, label: new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(date), day: date.getDate(), active: active.has(key) });
  }
  return days;
}
