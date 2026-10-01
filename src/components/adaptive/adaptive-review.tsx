"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { buildAdaptivePlan, getAdaptivePriorities, loadAdaptivePlan, markAdaptiveItemDone, markTopicReviewed, type AdaptivePlan, type AdaptivePriority, type ReviewRating } from "@/lib/adaptive";
import { generateRemediation, generateTargetedPractice } from "@/lib/adaptive-ai";
import styles from "./adaptive-review.module.css";

export function AdaptiveReview() {
  const [priorities, setPriorities] = useState<AdaptivePriority[]>([]);
  const [plan, setPlan] = useState<AdaptivePlan | null>(null);
  const [busy, setBusy] = useState("");
  const [output, setOutput] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState("");

  function refresh() { setPriorities(getAdaptivePriorities()); setPlan(loadAdaptivePlan()); }
  useEffect(refresh, []);

  async function generate(priority: AdaptivePriority, kind: "practice" | "remediation") {
    setBusy(`${kind}:${priority.areaKey}:${priority.topicSlug}`); setError(""); setOutput(null);
    try {
      const created = kind === "practice" ? await generateTargetedPractice(priority) : await generateRemediation(priority);
      setOutput({ title: created.item.title, content: created.result.answer });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate study content."); }
    finally { setBusy(""); }
  }

  function rate(priority: AdaptivePriority, rating: ReviewRating) {
    markTopicReviewed(priority.areaKey, priority.topicSlug, rating);
    refresh();
  }

  const recommendations = priorities.slice(0, 8);
  const measured = priorities.filter((item) => item.keyedAttempted >= 3).length;

  return <div className={styles.page}>
    <Link className={styles.back} href="/progress">← Progress</Link>
    <section className={styles.hero}>
      <div><span>RECOMMENDED REVIEW</span><h1>What deserves attention next.</h1><p>Kean I Help? chooses the order from real question evidence, pace, official CELE weight, coverage, and spaced-review timing. The internal score stays internal.</p></div>
      <JaceSticker mood="focus" size={120} />
    </section>

    <section className={styles.evidence}>
      <div><b>{measured}</b><span>topics with usable evidence</span></div>
      <div><b>{priorities.filter((item) => item.overdue && item.attempted > 0).length}</b><span>due for another look</span></div>
      <div><b>{priorities.filter((item) => item.attempted === 0).length}</b><span>not measured yet</span></div>
    </section>

    <section className={styles.plan}>
      <div className={styles.planHead}><div><span>TODAY'S FOCUS</span><h2>{plan ? `${plan.totalMinutes} focused minutes` : "Build a short plan"}</h2></div><button onClick={() => { setPlan(buildAdaptivePlan()); refresh(); }}>{plan ? "Rebuild" : "Build plan"}</button></div>
      {plan ? <div className={styles.planItems}>{plan.items.map((item) => <div key={item.id} className={item.status === "done" ? styles.done : ""}>
        <button className={styles.check} aria-label={`Mark ${item.topicName} done`} onClick={() => setPlan(markAdaptiveItemDone(item.id))}>✓</button>
        <span><b>{item.topicName}</b><small>{item.minutes} min · {humanMode(item.mode)} · {item.reason}</small></span>
      </div>)}</div> : <p>Keep this small. The goal is to repair what matters, not to fill the whole day.</p>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}><span>NEXT UP</span><h2>Why these topics are here</h2></div>
      <div className={styles.recommendations}>{recommendations.map((priority, index) => <article key={`${priority.areaKey}:${priority.topicSlug}`}>
        <div className={styles.rank}>{String(index + 1).padStart(2, "0")}</div>
        <div className={styles.topic}>
          <header><div><b>{priority.topicName}</b><span>{priority.areaShort} · {priority.areaWeight}% of CELE</span></div><em>{priority.dueLabel}</em></header>
          <p>{priority.reasons.slice(0, 2).join(" · ")}</p>
          <div className={styles.meta}><span>{priority.keyedAttempted ? `${priority.accuracy}% keyed accuracy` : "Not enough keyed evidence"}</span><span>{priority.avgSeconds ? `${priority.avgSeconds}s / question` : "Pace not measured"}</span><span>{humanMode(priority.mode)}</span></div>
          <div className={styles.actions}><Link href={`/progress/topics/${priority.areaKey}/${priority.topicSlug}`}>See evidence</Link><button disabled={!!busy} onClick={() => generate(priority, "practice")}>{busy === `practice:${priority.areaKey}:${priority.topicSlug}` ? "Building…" : "Targeted practice"}</button><button disabled={!!busy} onClick={() => generate(priority, "remediation")}>{busy === `remediation:${priority.areaKey}:${priority.topicSlug}` ? "Building…" : "Repair review"}</button></div>
          <div className={styles.rating}><span>After reviewing:</span>{(["hard", "okay", "easy"] as ReviewRating[]).map((rating) => <button key={rating} onClick={() => rate(priority, rating)}>{rating === "hard" ? "Still hard" : rating === "okay" ? "Getting there" : "Feels easy"}</button>)}</div>
        </div>
      </article>)}</div>
    </section>

    {error && <div className={styles.error}>{error}</div>}
    {output && <section className={styles.output}><span>SAVED STUDY CONTENT</span><h2>{output.title}</h2><p>{output.content}</p><Link href="/review/saved">Open Saved Review →</Link></section>}
  </div>;
}

function humanMode(mode: AdaptivePriority["mode"]) {
  const labels: Record<AdaptivePriority["mode"], string> = {
    baseline: "Build a baseline",
    remediation: "Repair the method",
    "targeted-practice": "Targeted practice",
    "speed-drill": "Speed work",
    "spaced-review": "Spaced review",
    mixed: "Keep active",
  };
  return labels[mode];
}
