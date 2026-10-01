"use client";
import { useEffect } from "react";
import { reconcileCloudPreferences } from "@/lib/sync-recovery";
export function SyncRecovery(){useEffect(()=>{let timer:number|undefined;const run=()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>void reconcileCloudPreferences(),900)};window.addEventListener("online",run);if(navigator.onLine)run();return()=>{window.removeEventListener("online",run);window.clearTimeout(timer)}},[]);return null}
