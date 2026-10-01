"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openAskJace } from "@/lib/ask-jace-client";
import { BrandMark } from "@/components/ui/brand-mark";
import { AccountMenu } from "@/components/settings/account-menu";
import styles from "./desktop-sidebar.module.css";

const links=[['Home','/','home.svg'],['Review','/review','review.svg'],['Practice','/practice','practice.svg'],['Progress','/progress','progress.svg']] as const;
export function DesktopSidebar(){
  const p=usePathname();
  const jaceActive=p.startsWith('/jace');
  return <aside className={styles.s}><BrandMark/><nav>{links.map(([l,h,i])=>{const active=h==='/'?p===h:p.startsWith(h);return <Link key={h} href={h} className={active?styles.active:''}><img src={`/assets/icons/navigation/${i}`} alt=""/><span>{l}</span></Link>})}</nav><div className={styles.grow}/>{jaceActive?<Link href="/jace" className={`${styles.jace} ${styles.active}`}><img src="/assets/jace/mini/nav.png" alt=""/><span>Ask Jace</span></Link>:<button className={styles.jace} onClick={()=>openAskJace()}><img src="/assets/jace/mini/nav.png" alt=""/><span>Ask Jace</span></button>}<AccountMenu variant="sidebar"/></aside>
}
