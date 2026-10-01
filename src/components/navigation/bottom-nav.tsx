"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { openAskJace } from "@/lib/ask-jace-client";
import styles from "./bottom-nav.module.css";

const nav=[['Home','/','home.svg'],['Review','/review','review.svg'],['Practice','/practice','practice.svg'],['Progress','/progress','progress.svg']] as const;
export function BottomNav(){
  const p=usePathname();
  if(p.includes('/run')||p.startsWith('/onboarding'))return null;
  const first=nav.slice(0,2),last=nav.slice(2);
  const item=([l,h,i]:typeof nav[number])=>{const a=h==='/'?p===h:p.startsWith(h);return <Link key={h} href={h} className={a?styles.a:''}><img src={`/assets/icons/navigation/${i}`} alt=""/><span>{l}</span></Link>};
  const jaceInner=<><span className={styles.sticker}><img src="/assets/jace/mini/nav.png" alt=""/></span><small>Jace</small></>;
  return <nav className={styles.n} aria-label="Primary"><div>{first.map(item)}{p.startsWith('/jace')?<Link href="/jace" className={`${styles.jace} ${styles.a}`} aria-label="Ask Jace">{jaceInner}</Link>:<button className={styles.jace} onClick={()=>openAskJace()} aria-label="Ask Jace">{jaceInner}</button>}{last.map(item)}</div></nav>
}
