"use client";

import type { ReactNode } from "react";
import katex from "katex";
import styles from "./jace-rich-text.module.css";

const SECTION_LABELS = new Set([
  "GIVEN", "REQUIRED", "FIND", "CONCEPT", "SOLUTION", "ANSWER", "CHECK",
  "WHY", "KEY IDEA", "KEY STEP", "YOUR APPROACH", "THE MISSED STEP", "CORRECT APPROACH",
  "LIKELY MISCONCEPTION", "MINIMAL RETEACH", "WORKED REPAIR", "WHAT TO NOTICE NEXT TIME",
  "QUICK REFRESH", "WORKED EXAMPLE", "PRACTICE", "FIX YOUR MISSES", "WRAP-UP", "ANSWERS",
]);

function inlineMath(text: string) {
  const parts = text.split(/(\$[^$\n]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const tex = part.slice(1, -1);
      const html = katex.renderToString(tex, { throwOnError: false, strict: "ignore", displayMode: false });
      return <span key={index} className={styles.inlineMath} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return <span key={index}>{boldParts.map((piece, j) => piece.startsWith("**") && piece.endsWith("**") ? <strong key={j}>{piece.slice(2,-2)}</strong> : piece)}</span>;
  });
}

function renderMath(tex: string, key: number) {
  const html = katex.renderToString(tex.trim(), { throwOnError: false, strict: "ignore", displayMode: true });
  return <div key={key} className={styles.math} tabIndex={0} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function JaceRichText({ content }: { content: string }) {
  const pieces = content.replace(/\r\n/g, "\n").split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);
  let key = 0;
  return <div className={styles.root}>{pieces.map(piece => {
    if (!piece) return null;
    if (piece.startsWith("$$") && piece.endsWith("$$")) return renderMath(piece.slice(2,-2), key++);
    if (piece.startsWith("\\[") && piece.endsWith("\\]")) return renderMath(piece.slice(2,-2), key++);
    const lines = piece.split("\n");
    const nodes: ReactNode[] = [];
    let list: string[] = [];
    const flushList = () => {
      if (!list.length) return;
      const values = list;
      list = [];
      nodes.push(<ul key={`list-${key++}`}>{values.map((item, i) => <li key={i}>{inlineMath(item)}</li>)}</ul>);
    };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushList(); continue; }
      if (/^[-•]\s+/.test(line)) { list.push(line.replace(/^[-•]\s+/, "")); continue; }
      flushList();
      const cleanedHeading = line.replace(/^#{1,3}\s*/, "").replace(/:$/, "").toUpperCase();
      if (SECTION_LABELS.has(cleanedHeading) || /^#{1,3}\s+/.test(line)) {
        nodes.push(<h3 key={`h-${key++}`}>{line.replace(/^#{1,3}\s*/, "").replace(/:$/, "")}</h3>);
      } else if (/^\d+[.)]\s+/.test(line)) {
        nodes.push(<p key={`step-${key++}`} className={styles.step}>{inlineMath(line)}</p>);
      } else if (/^```/.test(line)) {
        // Fence-only lines are omitted; content between them remains readable text.
      } else {
        nodes.push(<p key={`p-${key++}`}>{inlineMath(line)}</p>);
      }
    }
    flushList();
    return <div key={`block-${key++}`} className={styles.textBlock}>{nodes}</div>;
  })}</div>;
}
