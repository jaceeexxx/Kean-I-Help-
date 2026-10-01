"use client";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

export function WelcomeScreen(){
  const router=useRouter();
  function continueToSignIn(){
    document.cookie="kih-intro-seen=1; Path=/; Max-Age=31536000; SameSite=Lax";
    router.push("/sign-in");
  }
  return <div className={styles.stage}><section className={styles.welcome}>
    <img className={styles.logo} src="/assets/brand/logo-mark.png" alt="Kean I Help?"/>
    <div><h1>Kean I Help?</h1><p>Your CELE space. Organized for the work ahead, and made personally for you.</p></div>
    <span className={styles.signature}>For Kean, by Jace.</span>
    <button className={styles.primary} onClick={continueToSignIn}>Continue</button>
  </section></div>
}
