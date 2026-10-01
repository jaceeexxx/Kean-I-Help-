"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileTopbar } from "./mobile-topbar";
import { JaceReactionHost } from "@/components/jace/jace-reaction-host";
import { AskJace } from "@/components/jace/ask-jace";
import { NetworkStatus } from "@/components/system/network-status";
import { SyncRecovery } from "@/components/system/sync-recovery";
import { SkipLink } from "@/components/system/skip-link";
import styles from "./app-shell.module.css";

const PUBLIC = ["/welcome", "/sign-in", "/forgot-password", "/auth/reset-password", "/onboarding"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicPage = PUBLIC.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const examRun = pathname.includes("/run");

  if (publicPage) {
    return <main id="main-content" tabIndex={-1} className={styles.public}>{children}</main>;
  }

  return <>
    <SkipLink />
    <NetworkStatus />
    <SyncRecovery />
    {!examRun && <MobileTopbar />}
    {!examRun && <DesktopSidebar />}
    <main id="main-content" tabIndex={-1} className={examRun ? styles.exam : styles.m}>{children}</main>
    {!examRun && <JaceReactionHost />}
    {!examRun && <AskJace />}
    {!examRun && <BottomNav />}
  </>;
}
