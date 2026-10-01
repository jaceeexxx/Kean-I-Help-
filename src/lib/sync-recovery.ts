import { loadSetup } from "./onboarding";
import { loadUiPreferences } from "./ui-preferences";
import { loadJacePreferences } from "./jace-preferences";
import { loadNotificationPreferences } from "./notifications";
import { getLocalProfile } from "./profile-store";
import { createClient, isSupabaseConfigured } from "./supabase/client";

export type SyncState = "idle" | "syncing" | "synced" | "offline" | "error";
function emit(state:SyncState,message?:string){if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("kih:sync-status",{detail:{state,message}}))}

export async function reconcileCloudPreferences(){
  if(typeof window==="undefined"||!navigator.onLine){emit("offline");return false}
  if(!isSupabaseConfigured()){emit("idle","Local preview");return false}
  emit("syncing","Syncing preferences…");
  try{
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){emit("idle","Local-only state");return false}
    const setup=loadSetup(),ui=loadUiPreferences(),jace=loadJacePreferences(),profile=await getLocalProfile().catch(()=>null);
    const writes=await Promise.all([
      supabase.from("cele_settings").upsert({user_id:user.id,target_exam_date:setup.targetExamDate||null,daily_target_minutes:setup.dailyTargetMinutes,study_days:setup.studyDays,rest_days:setup.restDays,confidence:setup.confidence,reminder_enabled:setup.reminderEnabled,reminder_time:setup.reminderTime,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,onboarding_completed:setup.completed}),
      supabase.from("user_preferences").upsert({user_id:user.id,theme:ui.theme,reduced_motion:ui.reducedMotion,text_scale:ui.textScale}),
      supabase.from("jace_preferences").upsert({user_id:user.id,daily_messages_enabled:jace.dailyMessagesEnabled,sticker_reactions_enabled:jace.stickerReactionsEnabled}),
      profile?.displayName?supabase.from("profiles").upsert({id:user.id,display_name:profile.displayName}):Promise.resolve({error:null})
    ]);
    const dbError=(writes as Array<{error?:unknown}>).find(x=>x?.error)?.error;
    if(dbError)throw dbError;
    const notification=loadNotificationPreferences();
    const res=await fetch("/api/notifications/preferences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(notification)}).catch(()=>null);
    if(res&&!res.ok&&res.status!==401)throw new Error("Notification preference sync failed");
    emit("synced","Cloud preferences are current.");
    return true;
  }catch(error){emit("error",error instanceof Error?error.message:"Cloud sync could not complete.");return false}
}
