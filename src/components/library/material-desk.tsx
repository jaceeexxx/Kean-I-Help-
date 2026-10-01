"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JaceSticker } from "@/components/brand/jace-sticker";
import { getOrCreateMaterialExtraction, materialContext } from "@/lib/material-context";
import { getLibraryFile, toggleLibraryFavorite, updateLibraryItem } from "@/lib/library-service";
import { openAskJace } from "@/lib/ask-jace-client";
import { getArea, getTopic } from "@/lib/curriculum";
import type { LibraryItem, MaterialExtraction } from "@/lib/library-types";
import styles from "./material-desk.module.css";

type Tab = "document" | "study" | "notes";

function categoryLabel(category: LibraryItem["category"]) {
  if (category === "past-exam") return "Past Exam";
  if (category === "personal-note") return "Personal Note";
  return "Review Material";
}

export function MaterialDesk({ id }: { id: string }) {
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<MaterialExtraction | null>(null);
  const [active, setActive] = useState<Tab>("document");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Opening your material…");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getLibraryFile(id);
        if (!loaded) throw new Error("This Library item could not be found.");
        if (cancelled) return;
        setItem(loaded.item);
        setBlob(loaded.blob);
        setNotes(loaded.item.studyNotes || "");
        if (loaded.blob) {
          objectUrl = URL.createObjectURL(loaded.blob);
          setUrl(objectUrl);
        }
        setStatus("Reading document…");
        const nextExtraction = loaded.extraction || await getOrCreateMaterialExtraction(loaded.item, loaded.blob);
        if (cancelled) return;
        setExtraction(nextExtraction);
        setItem(current => current ? { ...current, pageCount: nextExtraction.pageCount, extractionStatus: nextExtraction.status } : current);
        setStatus("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open this material.");
          setStatus("");
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  const location = useMemo(() => {
    if (!item?.areaKey) return "Unassigned";
    const area = getArea(item.areaKey);
    const topic = getTopic(item.areaKey, item.topicSlug);
    return topic ? `${area?.short || item.areaKey} · ${topic.name}` : area?.name || item.areaKey;
  }, [item]);

  async function favorite() {
    if (!item) return;
    const next = await toggleLibraryFavorite(item);
    setItem(next || { ...item, favorite: !item.favorite });
  }

  async function saveNotes() {
    if (!item) return;
    setSaving(true);
    try {
      await updateLibraryItem(item.id, { studyNotes: notes });
      setItem({ ...item, studyNotes: notes });
    } finally {
      setSaving(false);
    }
  }

  function askJace() {
    if (!item || !extraction?.text) return;
    openAskJace({
      action: "explain",
      context: materialContext(item, extraction.text),
      message: `I'm studying “${item.title}”. Help me focus on the most CELE-relevant ideas without replacing the original source.`,
    });
  }

  if (!item) return <div className={styles.state}>{error || status}</div>;

  const readablePages = extraction?.pages.filter(page => page.readable) || [];
  const scanned = extraction?.scannedPages || [];

  return <div className={styles.page}>
    <header className={styles.top}>
      <Link href="/review/library">← Library</Link>
      <button onClick={favorite} aria-pressed={item.favorite}>{item.favorite ? "Saved ★" : "Save ☆"}</button>
    </header>

    <section className={styles.hero}>
      <div className={styles.eyebrow}>{categoryLabel(item.category)}</div>
      <h1>{item.title}</h1>
      <div className={styles.meta}>
        <span>{location}</span>
        {item.pageCount ? <span>{item.pageCount} {item.pageCount === 1 ? "page" : "pages"}</span> : null}
        <span>{item.source === "cloud" ? "Cloud + local cache" : "Saved on this device"}</span>
      </div>
    </section>

    <nav className={styles.tabs} aria-label="Material views">
      {(["document", "study", "notes"] as Tab[]).map(tab => <button key={tab} className={active === tab ? styles.active : ""} onClick={() => setActive(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}
    </nav>

    {status && <div className={styles.info}>{status}</div>}
    {error && <div className={styles.error}>{error}</div>}

    <div className={styles.workspace} data-active={active}>
      <section className={`${styles.pane} ${styles.documentPane}`}>
        <div className={styles.paneHead}><div><small>ORIGINAL</small><h2>Source document</h2></div>{url && <a href={url} target="_blank" rel="noreferrer">Open original ↗</a>}</div>
        <div className={styles.documentBody}>
          {item.category === "personal-note" ? <article className={styles.sourceNote}>{item.noteText || "This note is empty."}</article> : null}
          {url && item.mimeType === "application/pdf" ? <iframe src={url} title={item.title}/> : null}
          {url && item.mimeType?.startsWith("image/") ? <img src={url} alt={item.title}/> : null}
          {url && (item.mimeType?.startsWith("text/") || /\.(txt|md)$/i.test(item.fileName || "")) ? <article className={styles.sourceText}>{extraction?.text || "Reading text…"}</article> : null}
          {!url && item.category !== "personal-note" ? <div className={styles.missing}>The original file is not cached on this device yet.</div> : null}
        </div>
      </section>

      <section className={`${styles.pane} ${styles.studyPane}`}>
        <div className={styles.paneHead}><div><small>STUDY VIEW</small><h2>Organized from the source</h2></div></div>
        <div className={styles.studyBody}>
          {extraction?.status === "needs-review" && <div className={styles.warning}><b>Some pages need manual review.</b><span>{scanned.length ? `No reliable native text was found on page${scanned.length > 1 ? "s" : ""} ${scanned.slice(0, 10).join(", ")}${scanned.length > 10 ? "…" : ""}.` : "The source may be scanned or image-based."}</span></div>}
          {extraction?.status === "unsupported" && <div className={styles.warning}><b>Text extraction isn't available for this file type.</b><span>The original remains untouched and available to view. You can add your own notes beside it.</span></div>}

          <div className={styles.quickActions}>
            {item.category === "past-exam" ? <Link href={`/practice/prepare/${item.id}`}>Prepare as exam</Link> : <Link href={`/review/library/${item.id}/study`}>Build study session</Link>}
            <button onClick={askJace} disabled={!extraction?.text}><JaceSticker mood="explaining" size={28}/>Ask Jace about this</button>
          </div>

          {readablePages.length ? <div className={styles.pages}>
            {readablePages.map(page => <details key={page.pageNumber} open={page.pageNumber <= 2}>
              <summary>Page {page.pageNumber}</summary>
              <p>{page.text}</p>
            </details>)}
          </div> : <div className={styles.emptyStudy}>No machine-readable text is available yet. Use the source view and your notes together.</div>}
        </div>
      </section>

      <section className={`${styles.pane} ${styles.notesPane}`}>
        <div className={styles.paneHead}><div><small>MY NOTES</small><h2>Study beside the source</h2></div><span>{saving ? "Saving…" : "Autosave on exit"}</span></div>
        <textarea value={notes} onChange={event => setNotes(event.target.value)} onBlur={saveNotes} placeholder="Write what you want to remember, formulas to revisit, or questions for Jace…"/>
        <div className={styles.noteFoot}><button onClick={saveNotes} disabled={saving}>{saving ? "Saving…" : "Save notes"}</button><span>The original file is never overwritten.</span></div>
      </section>
    </div>
  </div>;
}
