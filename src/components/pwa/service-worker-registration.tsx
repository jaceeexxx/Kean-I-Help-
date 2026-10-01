"use client";
import { useEffect } from "react";

export function ServiceWorkerRegistration(){
  useEffect(()=>{
    if(!("serviceWorker" in navigator)||process.env.NODE_ENV!=="production")return;
    let registration:ServiceWorkerRegistration|undefined;
    const notify=()=>window.dispatchEvent(new CustomEvent("kih:update-ready",{detail:{registration}}));
    navigator.serviceWorker.register("/sw.js").then(reg=>{
      registration=reg;
      if(reg.waiting)notify();
      reg.addEventListener("updatefound",()=>{
        const worker=reg.installing;
        if(!worker)return;
        worker.addEventListener("statechange",()=>{
          if(worker.state==="installed"&&navigator.serviceWorker.controller)notify();
        });
      });
    }).catch(error=>console.warn("Service worker registration failed",error));
  },[]);
  return null;
}
