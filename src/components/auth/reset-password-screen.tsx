"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import styles from "./auth.module.css";

export function ResetPasswordScreen(){
  const router=useRouter();const[password,setPassword]=useState("");const[confirm,setConfirm]=useState("");const[busy,setBusy]=useState(false);const[status,setStatus]=useState("");const[error,setError]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setError(false);setStatus("");if(password.length<8){setError(true);setStatus("Use at least 8 characters for the new password.");return}if(password!==confirm){setError(true);setStatus("The two passwords don’t match.");return}if(!isSupabaseConfigured()){setError(true);setStatus("Supabase is not configured on this device.");return}setBusy(true);try{const{error:updateError}=await createClient().auth.updateUser({password});if(updateError)throw updateError;setStatus("Password updated. Returning to your reviewer…");setTimeout(()=>{router.replace("/");router.refresh()},700)}catch(err){setError(true);setStatus(err instanceof Error?err.message:"Could not update the password.")}finally{setBusy(false)}}
  return <div className={styles.stage}><section className={styles.auth}>
    <div className={styles.brand}><img src="/assets/brand/logo-mark.png" alt=""/><b>Kean I Help?</b></div>
    <h1>Choose a new password</h1><p>Keep it private and memorable enough that future-you won’t hate present-you.</p>
    <form className={styles.form} onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label><button className={styles.primary} disabled={busy}>{busy?"Updating…":"Update password"}</button></form>
    {status&&<div role="status" className={`${styles.status} ${error?styles.error:""}`}>{status}</div>}
  </section></div>
}
