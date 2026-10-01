"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./network-status.module.css";

type State="online"|"offline"|"syncing"|"synced"|"error"|"update";

export function NetworkStatus(){
  const pathname=usePathname();
  const[state,setState]=useState<State>("online");
  const[message,setMessage]=useState("");
  const[waiting,setWaiting]=useState<ServiceWorkerRegistration|null>(null);
  useEffect(()=>{
    let hide:number|undefined;
    const offline=()=>{window.clearTimeout(hide);setState("offline");setMessage("Offline · local study data remains available")};
    const online=()=>{setState("online");setMessage("Back online");hide=window.setTimeout(()=>setMessage(""),2200)};
    const sync=(event:Event)=>{const d=(event as CustomEvent).detail||{};if(d.state==="syncing"){setState("syncing");setMessage(d.message||"Syncing…")}else if(d.state==="synced"){setState("synced");setMessage(d.message||"Synced");hide=window.setTimeout(()=>setMessage(""),2200)}else if(d.state==="error"){setState("error");setMessage("Cloud sync will retry when possible")}};
    const update=(event:Event)=>{setState("update");setMessage("App update ready");setWaiting((event as CustomEvent).detail?.registration||null)};
    window.addEventListener("offline",offline);window.addEventListener("online",online);window.addEventListener("kih:sync-status",sync);window.addEventListener("kih:update-ready",update);
    if(!navigator.onLine)offline();
    return()=>{window.removeEventListener("offline",offline);window.removeEventListener("online",online);window.removeEventListener("kih:sync-status",sync);window.removeEventListener("kih:update-ready",update);window.clearTimeout(hide)};
  },[]);
  function refresh(){waiting?.waiting?.postMessage({type:"SKIP_WAITING"});window.location.reload()}
  if(!message)return <div className={styles.sr} aria-live="polite"/>;
  return <div className={`${styles.banner} ${styles[state]} ${pathname.includes("/run")?styles.exam:""}`} role="status" aria-live="polite"><span>{message}</span>{state==="update"&&<button onClick={refresh}>Refresh</button>}</div>;
}
