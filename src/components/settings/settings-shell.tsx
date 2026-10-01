"use client";
import type{ReactNode}from"react";
import Link from"next/link";
import{usePathname}from"next/navigation";
import styles from"./settings-shell.module.css";
const items=[['Account','/settings/account'],['Study plan','/settings/study-plan'],['Notifications','/settings/notifications'],['Appearance','/settings/appearance'],['Accessibility','/settings/accessibility'],['Data & backup','/settings/data']] as const;
export function SettingsShell({children}:{children:ReactNode}){const p=usePathname();return <div className={styles.layout}><aside><Link className={styles.profile} href="/profile">← Profile</Link><h2>Settings</h2><nav>{items.map(([label,href])=><Link key={href} href={href} className={p===href?styles.active:""}>{label}<span>›</span></Link>)}</nav></aside><div className={styles.content}>{children}</div></div>}
