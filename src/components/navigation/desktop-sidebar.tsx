"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openAskJace } from "@/lib/ask-jace-client";
import { BrandMark } from "@/components/ui/brand-mark";
import { AccountMenu } from "@/components/settings/account-menu";
import { NavigationIcon } from "@/components/ui/navigation-icon";
import styles from "./desktop-sidebar.module.css";
const links = [["Home", "/"], ["Review", "/review"], ["Practice", "/practice"], ["Progress", "/progress"]] as const;
export function DesktopSidebar() {
  const pathname = usePathname();
  const jaceActive = pathname.startsWith("/jace");
  return <aside className={styles.s} aria-label="Primary">
    <BrandMark/>
    <p className={styles.caption}>YOUR STUDY COMPANION</p>
    <nav aria-label="Study sections">{links.map(([label, href], index) => {
      const active = href === "/" ? pathname === href : pathname.startsWith(href) || (href === "/practice" && pathname.startsWith("/exam"));
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? styles.active : ""}><span className={styles.index} aria-hidden="true">0{index + 1}</span><span>{label}</span></Link>;
    })}</nav>
    <div className={styles.grow}/>
    <div className={styles.note}>A little practice.<br/><em>A little closer.</em></div>
    {jaceActive ? <Link href="/jace" aria-current="page" className={`${styles.jace} ${styles.active}`}><NavigationIcon name="jace"/><span>Ask Jace</span></Link> : <button className={styles.jace} onClick={() => openAskJace()}><NavigationIcon name="jace"/><span>Ask Jace</span></button>}
    <AccountMenu variant="sidebar"/>
  </aside>;
}
