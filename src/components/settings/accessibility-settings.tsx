"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { applyUiPreferences, defaultUiPreferences, loadUiPreferences, saveUiPreferences, type UiPreferences } from "@/lib/ui-preferences";
import styles from "./settings-ui.module.css";

export function AccessibilitySettings() {
  const [prefs, setPrefs] = useState<UiPreferences>(defaultUiPreferences);
  useEffect(() => setPrefs(loadUiPreferences()), []);
  function patch(value: Partial<UiPreferences>) {
    const next = { ...prefs, ...value };
    setPrefs(next);
    saveUiPreferences(next);
    applyUiPreferences(next);
  }
  return <div className={styles.page}>
    <Link className={styles.mobileBack} href="/settings">← Settings</Link>
    <span className={styles.eyebrow}>ACCESSIBILITY</span>
    <h1>Use it your way.</h1>
    <p className={styles.intro}>Kean I Help? also respects system reduced-motion and contrast preferences automatically.</p>
    <section className={styles.group}>
      <label className={styles.toggle}><input type="checkbox" checked={prefs.reducedMotion} onChange={e => patch({ reducedMotion: e.target.checked })}/><div><b>Reduce decorative motion</b><small>Minimizes Jace pops, animated transitions and nonessential movement.</small></div></label>
      <label className={styles.toggle}><input type="checkbox" checked={prefs.textScale === "large"} onChange={e => patch({ textScale: e.target.checked ? "large" : "standard" })}/><div><b>Larger text</b><small>Increases base UI text while keeping controls and formulas readable.</small></div></label>
      <label className={styles.toggle}><input type="checkbox" checked={prefs.highContrast} onChange={e => patch({ highContrast: e.target.checked })}/><div><b>Higher contrast</b><small>Strengthens borders, focus rings and secondary text separation.</small></div></label>
      <label className={styles.toggle}><input type="checkbox" checked={prefs.underlineLinks} onChange={e => patch({ underlineLinks: e.target.checked })}/><div><b>Always underline links</b><small>Makes text links easier to distinguish without relying on color alone.</small></div></label>
    </section>
    <div className={styles.status}>Changes apply immediately on this device.</div>
  </div>;
}
