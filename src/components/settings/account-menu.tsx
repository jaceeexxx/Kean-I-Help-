"use client";
import{useEffect,useRef,useState}from"react";
import Link from"next/link";
import{useRouter}from"next/navigation";
import{createClient,isSupabaseConfigured}from"@/lib/supabase/client";
import{getLocalProfile}from"@/lib/profile-store";
import styles from"./account-menu.module.css";

type Props={variant?:"topbar"|"sidebar"};
export function AccountMenu({variant="topbar"}:Props){
 const[open,setOpen]=useState(false),[name,setName]=useState("Kean"),[email,setEmail]=useState(""),[url,setUrl]=useState<string|null>(null),[busy,setBusy]=useState(false);const wrap=useRef<HTMLDivElement>(null);const router=useRouter();
 useEffect(()=>{let objectUrl:string|null=null;(async()=>{try{const local=await getLocalProfile();if(local?.displayName)setName(local.displayName);if(local?.avatarBlob){objectUrl=URL.createObjectURL(local.avatarBlob);setUrl(objectUrl)}if(!isSupabaseConfigured())return;const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;setEmail(user.email||"");const{data}=await supabase.from("profiles").select("display_name,avatar_path").eq("id",user.id).maybeSingle();if(data?.display_name)setName(data.display_name);if(data?.avatar_path){const signed=await supabase.storage.from("kean-profile").createSignedUrl(data.avatar_path,3600);if(signed.data?.signedUrl){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}setUrl(signed.data.signedUrl)}}}catch{}})();return()=>{if(objectUrl)URL.revokeObjectURL(objectUrl)}},[]);
 useEffect(()=>{function down(e:MouseEvent){if(wrap.current&&!wrap.current.contains(e.target as Node))setOpen(false)}document.addEventListener("mousedown",down);return()=>document.removeEventListener("mousedown",down)},[]);
 async function signOut(){if(!isSupabaseConfigured())return;setBusy(true);try{await createClient().auth.signOut({scope:"local"});setOpen(false);router.replace("/sign-in");router.refresh()}finally{setBusy(false)}}
 const avatar=url?<img src={url} alt="Kean profile"/>:<span>{name.trim().charAt(0).toUpperCase()||"K"}</span>;
 return <div ref={wrap} className={`${styles.wrap} ${styles[variant]}`}><button className={styles.trigger} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="dialog">{avatar}{variant==="sidebar"&&<b>{name}</b>}</button>{open&&<><button className={styles.scrim} aria-label="Close account menu" onClick={()=>setOpen(false)}/><section className={styles.menu} role="dialog" aria-label="Account menu"><div className={styles.handle}/><header><div className={styles.avatar}>{avatar}</div><div><b>{name}</b><span>{email||"CELE 2027"}</span></div></header><nav><Link href="/profile" onClick={()=>setOpen(false)}>Profile <span>›</span></Link><Link href="/settings/study-plan" onClick={()=>setOpen(false)}>Study preferences <span>›</span></Link><Link href="/settings/notifications" onClick={()=>setOpen(false)}>Notifications <span>›</span></Link><Link href="/settings/appearance" onClick={()=>setOpen(false)}>Appearance <span>›</span></Link><Link href="/settings/data" onClick={()=>setOpen(false)}>Data & backup <span>›</span></Link></nav><button className={styles.signout} disabled={busy} onClick={signOut}>{busy?"Signing out…":"Sign out"}</button><footer>For Kean, by Jace.</footer></section></>}</div>
}
