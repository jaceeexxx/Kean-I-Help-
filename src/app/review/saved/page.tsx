"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lessons } from "@/lib/review-content";
import { listAiReviewItems, removeAiReviewItem, type AiReviewItem } from "@/lib/ai-review-store";
import { listLibrary } from "@/lib/library-service";
import type { LibraryItem } from "@/lib/library-types";
import { ReviewTabs } from "@/components/review/review-tabs";
import styles from "./saved.module.css";

export default function Page() {
  const [items, setItems] = useState<AiReviewItem[]>([]);
  const [materials, setMaterials] = useState<LibraryItem[]>([]);
  const [formulaSlugs, setFormulaSlugs] = useState<string[]>([]);

  useEffect(() => {
    setItems(listAiReviewItems());
    listLibrary().then(all => setMaterials(all.filter(item => item.favorite))).catch(() => setMaterials([]));
    setFormulaSlugs(lessons.filter(lesson => localStorage.getItem(`kih:formula:${lesson.slug}`) === "true").map(lesson => lesson.slug));
  }, []);

  function remove(id:string){removeAiReviewItem(id);setItems(listAiReviewItems())}

  return <div className={styles.page}>
    <section className={styles.heading}><p>REVIEW</p><h1>Saved</h1><span>Things Kean explicitly chose to return to.</span></section>
    <ReviewTabs/>

    <section className={styles.group}>
      <div className={styles.label}>MATERIALS <span>{materials.length}</span></div>
      {materials.length ? <div className={styles.materialRows}>{materials.map(item => <Link key={item.id} href={`/review/library/${item.id}`}><div><small>{item.category.replaceAll("-", " ").toUpperCase()}</small><b>{item.title}</b><span>{item.fileName || "Personal note"}</span></div><strong>›</strong></Link>)}</div> : <div className={styles.empty}>Tap Save in the Study Desk and the material will appear here.</div>}
    </section>

    <section className={styles.group}>
      <div className={styles.label}>FORMULAS <span>{formulaSlugs.length}</span></div>
      {formulaSlugs.length ? <div className={styles.rows}>{formulaSlugs.map(slug => {const lesson=lessons.find(item=>item.slug===slug)!;return <Link key={slug} href={`/review/lesson/${slug}`}><div><b>{lesson.formula}</b><span>{lesson.title}</span></div><strong>›</strong></Link>})}</div> : <div className={styles.empty}>Pin a formula from a lesson and it will appear here.</div>}
    </section>

    <section className={styles.group}>
      <div className={styles.label}>JACE ANSWERS <span>{items.length}</span></div>
      {items.length ? <div className={styles.answers}>{items.map(item=><article key={item.id}><div className={styles.answerHead}><div><small>{item.kind.replaceAll("-"," ").toUpperCase()}</small><h2>{item.title}</h2>{item.sourceTitle&&<span>Source: {item.sourceTitle}</span>}</div><button onClick={()=>remove(item.id)}>Remove</button></div><p>{item.content}</p></article>)}</div> : <div className={styles.empty}>Save a useful Ask Jace answer and it will stay here for review.</div>}
    </section>
  </div>
}
