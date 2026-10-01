"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addLibraryFile, addNote, listLibrary } from "@/lib/library-service";
import { getOrCreateMaterialExtraction } from "@/lib/material-context";
import { areas, type AreaKey } from "@/lib/curriculum";
import type { LibraryCategory, LibraryItem } from "@/lib/library-types";
import { ReviewTabs } from "./review-tabs";
import styles from "./library-workspace.module.css";

function categoryLabel(category: LibraryCategory) {
  if (category === "past-exam") return "Past Exam";
  if (category === "personal-note") return "Note";
  return "Material";
}

function prettySize(size?: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function LibraryWorkspace(){
  const [items,setItems]=useState<LibraryItem[]>([]);
  const [filter,setFilter]=useState<"all"|LibraryCategory>("all");
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  const [category,setCategory]=useState<LibraryCategory>("review-material");
  const [title,setTitle]=useState("");
  const [note,setNote]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [areaKey,setAreaKey]=useState<""|AreaKey>("");
  const [topicSlug,setTopicSlug]=useState("");
  const [stage,setStage]=useState("");
  const [error,setError]=useState("");

  async function refresh(){setItems(await listLibrary())}
  useEffect(()=>{refresh()},[]);

  const topics = useMemo(() => areas.find(area => area.key === areaKey)?.topics || [], [areaKey]);
  const shown=useMemo(()=>items.filter(item=>(filter==="all"||item.category===filter)&&`${item.title} ${item.fileName||""} ${item.noteText||""}`.toLowerCase().includes(search.toLowerCase())),[items,filter,search]);

  async function save(){
    if(!title.trim())return;
    setError("");
    try {
      setStage(category === "personal-note" ? "Saving note…" : "Uploading original…");
      if(category==="personal-note") {
        await addNote(title.trim(),note.trim(),areaKey || undefined,topicSlug || undefined);
      } else if(file) {
        const item = await addLibraryFile({category,title:title.trim(),file,areaKey:areaKey || undefined,topicSlug:topicSlug || undefined});
        setStage("Reading document…");
        await getOrCreateMaterialExtraction(item,file);
        setStage("Organizing study view…");
      }
      setStage("Ready");
      setTitle("");setNote("");setFile(null);setAreaKey("");setTopicSlug("");
      await refresh();
      window.setTimeout(()=>{setOpen(false);setStage("")},500);
    } catch(err) {
      setError(err instanceof Error ? err.message : "Could not add this material.");
      setStage("");
    }
  }

  function chooseFile(next: File | null) {
    setFile(next);
    if (next && !title.trim()) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  return <div className={styles.page}>
    <section className={styles.heading}><p>REVIEW</p><h1>Library</h1><span>Your reviewers, past exams, and notes — organized without touching the originals.</span></section>
    <ReviewTabs/>

    <div className={styles.toolbar}>
      <label><span aria-hidden="true">⌕</span><input placeholder="Search your library..." value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <button onClick={()=>setOpen(v=>!v)}>{open?"Close":"+ Add material"}</button>
    </div>

    {open&&<section className={styles.add}>
      <div><small className={styles.addEyebrow}>ADD TO LIBRARY</small><h2>What are you adding?</h2></div>
      <div className={styles.segment}>{([['past-exam','Past Exam'],['review-material','Review Material'],['personal-note','Personal Note']] as [LibraryCategory,string][]).map(([value,label])=><button className={category===value?styles.on:""} key={value} onClick={()=>setCategory(value)}>{label}</button>)}</div>
      <div className={styles.formGrid}>
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give it a useful name"/></label>
        <label>CELE area<select value={areaKey} onChange={e=>{setAreaKey(e.target.value as ""|AreaKey);setTopicSlug("")}}><option value="">Optional</option>{areas.map(area=><option key={area.key} value={area.key}>{area.short}</option>)}</select></label>
        <label>Topic<select value={topicSlug} disabled={!areaKey} onChange={e=>setTopicSlug(e.target.value)}><option value="">Optional</option>{topics.map(topic=><option key={topic.slug} value={topic.slug}>{topic.name}</option>)}</select></label>
      </div>
      {category==="personal-note"?<label>Note<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Write your note..."/></label>:<label className={styles.fileField}>Original file<input type="file" accept="application/pdf,text/plain,text/markdown,image/*" onChange={e=>chooseFile(e.target.files?.[0]||null)}/>{file&&<span>{file.name} · {prettySize(file.size)}</span>}</label>}
      {stage&&<div className={styles.stage}><i aria-hidden="true"/><span>{stage}</span></div>}
      {error&&<div className={styles.error}>{error}</div>}
      <button className={styles.save} disabled={Boolean(stage)&&stage!=="Ready"||!title.trim()||(category==="personal-note"?!note.trim():!file)} onClick={save}>Add to Library</button>
    </section>}

    <div className={styles.filters}>{([['all','All'],['past-exam','Past Exams'],['review-material','Materials'],['personal-note','Notes']] as const).map(([value,label])=><button key={value} className={filter===value?styles.on:""} onClick={()=>setFilter(value)}>{label}</button>)}</div>

    {shown.length?<div className={styles.list}>{shown.map(item=>{
      const area = item.areaKey ? areas.find(candidate=>candidate.key===item.areaKey) : undefined;
      const topic = area?.topics.find(candidate=>candidate.slug===item.topicSlug);
      return <Link href={`/review/library/${item.id}`} key={item.id}>
        <div className={styles.fileIcon} aria-hidden="true">{item.category==="past-exam"?"EX":item.category==="personal-note"?"N":"PDF"}</div>
        <div className={styles.fileMain}><small>{categoryLabel(item.category).toUpperCase()}</small><b>{item.title}</b><span>{topic?.name || area?.short || item.fileName || item.noteText?.slice(0,90) || "Library item"}</span></div>
        <div className={styles.fileMeta}>{item.favorite&&<span>★</span>}{item.pageCount?<small>{item.pageCount}p</small>:null}<strong>›</strong></div>
      </Link>
    })}</div>:<div className={styles.empty}><img src="/assets/illustrations/empty-library.svg" alt=""/><h2>{items.length?"Nothing matches that search.":"Your study shelf is empty."}</h2><p>{items.length?"Try another title or category.":"Add reviewers, past exams, or notes and they’ll stay organized here."}</p>{!items.length&&<button onClick={()=>setOpen(true)}>Add your first material</button>}</div>}
  </div>
}
