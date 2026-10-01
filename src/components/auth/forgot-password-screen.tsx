"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function ForgotPasswordScreen(){
  const[email,setEmail]=useState("");const[busy,setBusy]=useState(false);const[status,setStatus]=useState("");const[error,setError]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setStatus("");setError(false);if(!isSupabaseConfigured()){setError(true);setStatus("Supabase is not configured on this device.");return}setBusy(true);try{const origin=window.location.origin;const{error:resetError}=await createClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:`${origin}/auth/callback?next=/auth/reset-password`});if(resetError)throw resetError;setStatus("Check your email for the password reset link.")}catch(err){setError(true);setStatus(err instanceof Error?err.message:"Could not send the reset link.")}finally{setBusy(false)}}
  return <div className={styles.stage}><section className={styles.auth}>
    <Link className={styles.back} href="/sign-in">← Sign in</Link>
    <div className={styles.brand}><img src="/assets/brand/logo-mark.png" alt=""/><b>Kean I Help?</b></div>
    <h1>Reset password</h1><p>Enter the email attached to Kean’s private account.</p>
    <form className={styles.form} onSubmit={submit}><label>Email<input type="email" autoComplete="email" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button className={styles.primary} disabled={busy}>{busy?"Sending…":"Send reset link"}</button></form>
    {status&&<div role="status" className={`${styles.status} ${error?styles.error:""}`}>{status}</div>}
  </section></div>
}
