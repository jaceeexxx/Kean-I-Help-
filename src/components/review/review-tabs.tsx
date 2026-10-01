"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./review-tabs.module.css";

const tabs = [
  ["Overview", "/review"],
  ["Library", "/review/library"],
  ["Saved", "/review/saved"],
] as const;

export function ReviewTabs() {
  const pathname = usePathname();
  return <nav className={styles.tabs} aria-label="Review sections">
    {tabs.map(([label, href]) => {
      const active = href === "/review" ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} className={active ? styles.active : ""}>{label}</Link>;
    })}
  </nav>;
}
