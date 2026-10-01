"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { areas, type AreaKey } from "@/lib/curriculum";
import { buildQuickPractice, buildTargetedPractice } from "@/lib/practice-builder";
import { getAttempt, listExams } from "@/lib/exam-store";
import { listLibrary, seedDemoPastExam } from "@/lib/library-service";
import { CELE_SIMULATION_STANDARD } from "@/lib/simulation/cele-config";
import type { StructuredExam } from "@/lib/exam-types";
import type { LibraryItem } from "@/lib/library-types";
import styles from "./exam-home.module.css";

export function ExamHome() {
  const router = useRouter();
  const [exams, setExams] = useState<StructuredExam[]>([]);
  const [raw, setRaw] = useState<LibraryItem[]>([]);
  const [areaKey, setAreaKey] = useState<AreaKey>("structural");
  const [topicSlug, setTopicSlug] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setExams(listExams());
    setRaw((await listLibrary()).filter((item) => item.category === "past-exam"));
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedArea = useMemo(() => areas.find((area) => area.key === areaKey)!, [areaKey]);
  const sourceExams = exams.filter((exam) => !exam.libraryId.startsWith("derived:"));
  const resumable = sourceExams.find((exam) => {
    const attempt = getAttempt(exam.id);
    return attempt && !attempt.submittedAt;
  });

  function startQuick() {
    const exam = buildQuickPractice(10);
    if (!exam) {
      setMessage("Add or prepare a Past Exam first so Quick Practice has verified questions to use.");
      return;
    }
    router.push(`/practice/${exam.id}/run?mode=practice`);
  }

  function startTargeted() {
    const exam = buildTargetedPractice(areaKey, topicSlug || undefined, 10);
    if (!exam) {
      setMessage("No verified questions match that area/topic yet. Prepare a Past Exam or choose another topic.");
      return;
    }
    router.push(`/practice/${exam.id}/run?mode=practice`);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <small>PRACTICE</small>
        <h1>Practice, at your pace.</h1>
        <p>
          Short practice when you need feedback. PRC-style simulation when you need exam conditions.
        </p>
      </section>

      {resumable && (
        <section className={styles.continue}>
          <div>
            <small>CONTINUE</small>
            <h2>{resumable.title}</h2>
            <p>There is an autosaved {getAttempt(resumable.id)?.mode} attempt on this device.</p>
          </div>
          <Link href={`/practice/${resumable.id}`}>Continue</Link>
        </section>
      )}

      <section className={styles.actions}>
        <div className={styles.sectionHead}>
          <div>
            <small>YOUR NEXT SESSION</small>
            <h2>Start small. Build confidence.</h2>
          </div>
        </div>

        <div className={styles.actionList}>
          <button onClick={startQuick}>
            <span className={styles.icon} aria-hidden="true">01</span>
            <span><b>Quick Practice</b><small>10 mixed questions from your verified question bank.</small></span>
            
          </button>
          <button className={styles.targetButton} onClick={() => document.getElementById("targeted-practice")?.scrollIntoView({ behavior: "smooth" })}>
            <span className={styles.icon} aria-hidden="true">02</span>
            <span><b>Targeted Practice</b><small>Choose a CELE area or a specific topic.</small></span>
            
          </button>
          <Link href="#past-exams">
            <span className={styles.icon} aria-hidden="true">03</span>
            <span><b>Past Exams</b><small>Use uploaded papers in Practice or Simulation mode.</small></span>
            
          </Link>
        </div>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section id="targeted-practice" className={styles.targeted}>
        <small>TARGETED PRACTICE</small>
        <h2>What do you want to work on?</h2>
        <div className={styles.fields}>
          <label>
            <span>Area</span>
            <select value={areaKey} onChange={(event) => { setAreaKey(event.target.value as AreaKey); setTopicSlug(""); }}>
              {areas.map((area) => <option key={area.key} value={area.key}>{area.name}</option>)}
            </select>
          </label>
          <label>
            <span>Topic</span>
            <select value={topicSlug} onChange={(event) => setTopicSlug(event.target.value)}>
              <option value="">Any topic in this area</option>
              {selectedArea.topics.map((topic) => <option key={topic.slug} value={topic.slug}>{topic.name}</option>)}
            </select>
          </label>
        </div>
        <button className={styles.primary} onClick={startTargeted}>Start 10-question practice</button>
      </section>

      <section className={styles.prc}>
        <div>
          <small>PRC SIMULATION STANDARD</small>
          <h2>Get familiar with exam day.</h2>
          <p>
            Based on {CELE_SIMULATION_STANDARD.guidelineVersion}, effective {CELE_SIMULATION_STANDARD.effectiveFrom}.
            The timer keeps running when you leave the app. Choose a session when you have time to focus.
          </p>
        </div>
        <div className={styles.blocks}>
          {CELE_SIMULATION_STANDARD.blocks.map((block) => (
            <article key={block.key}>
              <span>Day {block.day}</span>
              <h3>{block.shortLabel}</h3>
              <b>{block.durationMinutes / 60} hours</b>
              <small>{block.officialStart}–{block.officialEnd} · {block.weight}% of CELE</small>
              {block.knownQuestionCount && <small>{block.knownQuestionCount} computation-heavy questions noted by PRC</small>}
            </article>
          ))}
        </div>
        <a className={styles.source} href={CELE_SIMULATION_STANDARD.sourceUrl} target="_blank" rel="noreferrer">View PRC source</a>
      </section>

      <section id="past-exams" className={styles.papers}>
        <div className={styles.sectionHead}>
          <div><small>PAST EXAMS</small><h2>Verified papers</h2></div>
        </div>
        {sourceExams.length > 0 ? (
          <div className={styles.paperList}>
            {sourceExams.map((exam) => {
              const attempt = getAttempt(exam.id);
              return (
                <Link key={exam.id} href={`/practice/${exam.id}`}>
                  <span><b>{exam.title}</b><small>{exam.questions.length} questions · {exam.durationMinutes} min{attempt && !attempt.submittedAt ? " · Resume available" : ""}</small></span>
                  
                </Link>
              );
            })}
          </div>
        ) : <p className={styles.empty}>No verified past exam yet.</p>}

        {raw.length > 0 && (
          <>
            <h3 className={styles.libraryTitle}>From your Library</h3>
            <div className={styles.paperList}>
              {raw.map((item) => (
                <Link key={item.id} href={`/practice/prepare/${item.id}`}>
                  <span><b>{item.title}</b><small>Original uploaded paper · prepare question structure</small></span>
                  <i>Prepare</i>
                </Link>
              ))}
            </div>
          </>
        )}

        {!raw.length && !sourceExams.length && (
          <button className={styles.demo} onClick={async () => { await seedDemoPastExam(); await load(); }}>
            Create demo Past Exam
          </button>
        )}
      </section>
    </div>
  );
}
