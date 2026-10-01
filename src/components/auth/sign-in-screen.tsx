"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function SignInScreen(){
  const router=useRouter();
  const params=useSearchParams();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState(params.get("error")||"");
  const [error,setError]=useState(Boolean(params.get("error")));

  async function submit(event:FormEvent){
    event.preventDefault();setStatus("");setError(false);
    if(!isSupabaseConfigured()){setError(true);setStatus("Cloud sign-in is not configured on this device yet.");return}
    setBusy(true);
    try{
      const supabase=createClient();
      const {error:signInError}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(signInError)throw signInError;
      document.cookie="kih-intro-seen=1; Path=/; Max-Age=31536000; SameSite=Lax";
      router.replace(params.get("next")||"/");
      router.refresh();
    }catch(e){
      setError(true);
      const message=e instanceof Error?e.message:"Could not sign in.";
      setStatus(message.toLowerCase().includes("invalid login")?"That email or password doesn’t match. Try again.":message);
    }finally{setBusy(false)}
  }

  return <div className={styles.stage}><section className={styles.auth}>
    <Link className={styles.back} href="/welcome">← Back</Link>
    <div className={styles.brand}><img src="/assets/brand/logo-mark.png" alt=""/><b>Kean I Help?</b></div>
    <h1>Sign in</h1><p>Welcome back, Kean. Your reviewer is right where you left it.</p>
    <form className={styles.form} onSubmit={submit}>
      <label>Email<input type="email" autoComplete="username" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Password<div className={styles.password}><input type={show?"text":"password"} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className={styles.show} onClick={()=>setShow(v=>!v)}>{show?"Hide":"Show"}</button></div></label>
      <button className={styles.primary} disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
    </form>
    <Link className={styles.link} href="/forgot-password">Forgot password?</Link>
    {status&&<div role="status" className={`${styles.status} ${error?styles.error:""}`}>{status}</div>}
    <div className={styles.private}>Private account only. New accounts cannot be created from the app.</div>
  </section></div>
}
