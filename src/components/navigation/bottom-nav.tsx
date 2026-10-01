"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openAskJace } from "@/lib/ask-jace-client";
import { NavigationIcon } from "@/components/ui/navigation-icon";
import styles from "./bottom-nav.module.css";
const nav = [["Home", "/", "home"], ["Review", "/review", "review"], ["Practice", "/practice", "practice"], ["Progress", "/progress", "progress"]] as const;
export function BottomNav() {
  const pathname = usePathname();
  if (pathname.includes("/run") || pathname.startsWith("/onboarding")) return null;
  const item = ([label, href, icon]: typeof nav[number]) => {
    const active = href === "/" ? pathname === href : pathname.startsWith(href) || (href === "/practice" && pathname.startsWith("/exam"));
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? styles.a : ""}><NavigationIcon name={icon}/><span>{label}</span></Link>;
  };
  const jace = <><NavigationIcon name="jace"/><span>Jace</span></>;
  return <nav className={styles.n} aria-label="Primary"><div>{nav.slice(0, 2).map(item)}{pathname.startsWith("/jace") ? <Link href="/jace" aria-current="page" className={`${styles.jace} ${styles.a}`} aria-label="Ask Jace">{jace}</Link> : <button className={styles.jace} onClick={() => openAskJace()} aria-label="Ask Jace">{jace}</button>}{nav.slice(2).map(item)}</div></nav>;
}
