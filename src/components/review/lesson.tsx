"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LessonData } from "@/lib/review-content";
import { areas } from "@/lib/curriculum";
import { emitJaceReaction } from "@/lib/jace-personality";
import { openAskJace } from "@/lib/ask-jace-client";
import { JaceSticker } from "@/components/brand/jace-sticker";
import styles from "./lesson.module.css";

export function Lesson({ l }: { l: LessonData }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [formulaSaved, setFormulaSaved] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setFormulaSaved(localStorage.getItem(`kih:formula:${l.slug}`) === "true");
    setComplete(localStorage.getItem(`kih:lesson-complete:${l.slug}`) === "true");
  }, [l.slug]);

  const match = areas.flatMap(area => area.topics.map(topic => ({ area, topic }))).find(item => item.topic.lessonSlug === l.slug);
  const baseContext = {
    kind: "lesson" as const,
    label: l.title,
    text: `${l.subtitle}\n\nLearning outcomes:\n${l.outcomes.join("\n")}\n\nConcepts:\n${l.concept.join("\n")}\n\nFormula/relationship:\n${l.formula}\n${l.formulaNote}\n\nWorked example:\nGiven: ${l.workedExample.given}\nFind: ${l.workedExample.find}\n${l.workedExample.steps.join("\n")}\nAnswer: ${l.workedExample.answer}`,
    areaKey: match?.area.key,
    topicSlug: match?.topic.slug,
  };

  function check() {
    if (answer === null) return;
    setChecked(true);
    window.setTimeout(() => emitJaceReaction(answer === l.question.answer ? "lesson-correct" : "lesson-miss", { reactionKey: `lesson-check:${l.slug}:${answer}:${new Date().toDateString()}` }), 420);
  }

  function finish() {
    setComplete(true);
    localStorage.setItem(`kih:lesson-complete:${l.slug}`, "true");
    window.setTimeout(() => emitJaceReaction("lesson-complete", { reactionKey: `lesson-complete:${l.slug}:${new Date().toDateString()}` }), 420);
  }

  function askWhyWrong() {
    if (answer === null) return;
    const selected = `${String.fromCharCode(65 + answer)}. ${l.question.choices[answer]}`;
    const keyed = `${String.fromCharCode(65 + l.question.answer)}. ${l.question.choices[l.question.answer]}`;
    openAskJace({
      action: "why_wrong",
      message: `I chose ${selected}. The keyed answer is ${keyed}. Explain exactly what I misunderstood and how to spot the right approach next time.`,
      context: { ...baseContext, text: `${baseContext.text}\n\nLearner selected: ${selected}\nKeyed answer: ${keyed}` },
    });
  }

  return <div className={styles.page}>
    <div className={styles.topline}>
      <Link href={match ? `/review/topic/${match.area.key}/${match.topic.slug}` : "/review"}>← {match?.topic.name || "Review"}</Link>
      <span>{l.readMinutes} min read</span>
    </div>

    <div className={styles.layout}>
      <article className={styles.article}>
        <header className={styles.hero} id="top">
          <p>{l.subtitle}</p>
          <h1>{l.title}</h1>
          <div><span>{l.readMinutes} min</span><span>•</span><span>{match?.area.short || "CELE"}</span>{complete&&<><span>•</span><strong>Completed</strong></>}</div>
        </header>

        <section id="outcomes">
          <div className={styles.eyebrow}>WHAT YOU&apos;LL UNDERSTAND</div>
          <ul className={styles.outcomes}>{l.outcomes.map(item => <li key={item}>{item}</li>)}</ul>
        </section>

        <section id="idea">
          <div className={styles.eyebrow}>THE IDEA</div>
          <div className={styles.prose}>{l.concept.map(item => <p key={item}>{item}</p>)}</div>
          <div className={styles.formula}>
            <code>{l.formula}</code>
            <p>{l.formulaNote}</p>
            <button onClick={() => { const next = !formulaSaved; setFormulaSaved(next); localStorage.setItem(`kih:formula:${l.slug}`, String(next)); }}>{formulaSaved ? "Saved ✓" : "Save formula"}</button>
          </div>
        </section>

        <aside className={styles.jaceNote}>
          <JaceSticker mood="explaining" size={76}/>
          <div><small>JACE&apos;S NOTE</small><p className="kih-editorial">{l.jace}</p></div>
        </aside>

        <section id="example">
          <div className={styles.eyebrow}>WORKED EXAMPLE</div>
          <div className={styles.exampleMeta}><div><span>GIVEN</span><p>{l.workedExample.given}</p></div><div><span>FIND</span><p>{l.workedExample.find}</p></div></div>
          <ol className={styles.steps}>{l.workedExample.steps.map(step => <li key={step}>{step}</li>)}</ol>
          <div className={styles.answer}><span>ANSWER</span><b>{l.workedExample.answer}</b></div>
        </section>

        <section id="check" className={styles.check}>
          <div className={styles.eyebrow}>CHECK YOURSELF</div>
          <h2>{l.question.prompt}</h2>
          <div className={styles.choices}>{l.question.choices.map((choice, index) => <button key={choice} className={answer === index ? styles.selected : ""} onClick={() => { setAnswer(index); setChecked(false); }}><span>{String.fromCharCode(65 + index)}</span><b>{choice}</b></button>)}</div>
          {checked && <div className={answer === l.question.answer ? styles.feedbackGood : styles.feedbackFix}>
            <b>{answer === l.question.answer ? "Correct." : "Not quite."}</b>
            <p>{answer === l.question.answer ? "Keep the reasoning, not just the letter." : "Go back to the key relationship and identify which condition the option violates."}</p>
            {answer !== l.question.answer && <button onClick={askWhyWrong}>Ask Jace why</button>}
          </div>}
          {!checked ? <button className={styles.primary} disabled={answer === null} onClick={check}>Check answer</button> : !complete ? <button className={styles.primary} onClick={finish}>Finish lesson</button> : <div className={styles.complete}><JaceSticker mood="proud" size={80}/><div><small>LESSON COMPLETE</small><h3>One topic lighter.</h3><p>Come back when you need it. The formula stays saved if you pinned it.</p></div></div>}
        </section>

        <footer className={styles.footerActions}>
          <button onClick={() => openAskJace({ context: baseContext, action: "explain", message: "Explain this lesson in a way that helps me solve CELE questions, not just memorize it." })}>Ask Jace about this lesson</button>
          <Link href="/practice">Practice this topic →</Link>
        </footer>
      </article>

      <aside className={styles.outline} aria-label="Lesson outline">
        <span>IN THIS LESSON</span>
        <a href="#outcomes">What you&apos;ll understand</a>
        <a href="#idea">The idea</a>
        <a href="#example">Worked example</a>
        <a href="#check">Check yourself</a>
        <button onClick={() => openAskJace({ context: baseContext, action: "simplify", message: "Give me a short, memory-friendly recap of this lesson." })}>Quick recap with Jace</button>
      </aside>
    </div>
  </div>;
}
