import webpush from "web-push";
import { countdownMessages } from "@/content/jace-content";
import { createAdminClient } from "@/lib/supabase/admin";

export type CloudNotificationPreferences = {
  user_id: string;
  enabled: boolean;
  study_reminders: boolean;
  due_review_reminders: boolean;
  countdown_milestones: boolean;
  special_jace_messages: boolean;
  rest_day_suppression: boolean;
  preferred_time: string;
  special_time: string;
  quiet_start: string;
  quiet_end: string;
  max_daily_notifications: number;
  timezone: string;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotificationEvent = { eventKey: string; title: string; body: string; url: string; localDate: string };

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured.");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function partsInTimeZone(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(x => x.type === type)?.value || "";
  const weekdayMap: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, time: `${get("hour")}:${get("minute")}`, weekday: weekdayMap[get("weekday")] ?? 0 };
}

function toMinutes(hhmm: string) {
  const [h,m] = hhmm.slice(0,5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function inTargetWindow(now: string, target: string, windowMinutes = 9) {
  const n = toMinutes(now), t = toMinutes(target);
  return n >= t && n <= t + windowMinutes;
}

function inQuietHours(now: string, start: string, end: string) {
  const n = toMinutes(now), s = toMinutes(start), e = toMinutes(end);
  if (s === e) return false;
  return s < e ? n >= s && n < e : n >= s || n < e;
}

function dateDiffDays(target: string | null | undefined, localDate: string) {
  if (!target) return null;
  const t = Date.parse(`${target}T00:00:00Z`), d = Date.parse(`${localDate}T00:00:00Z`);
  if (Number.isNaN(t) || Number.isNaN(d)) return null;
  return Math.round((t - d) / 86_400_000);
}

async function alreadySentToday(userId: string, localDate: string, maxDaily: number) {
  const admin = createAdminClient();
  const { count, error } = await admin.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("local_date", localDate).eq("status", "sent");
  if (error) throw error;
  return (count || 0) >= maxDaily;
}

export async function chooseNotificationEvent(pref: CloudNotificationPreferences, now = new Date()): Promise<NotificationEvent | null> {
  if (!pref.enabled) return null;
  const local = partsInTimeZone(now, pref.timezone || "Asia/Manila");
  if (inQuietHours(local.time, pref.quiet_start, pref.quiet_end)) return null;
  if (await alreadySentToday(pref.user_id, local.date, Math.max(1, pref.max_daily_notifications || 1))) return null;
  const admin = createAdminClient();
  const { data: setup } = await admin.from("cele_settings").select("target_exam_date,study_days,rest_days,reminder_time").eq("user_id", pref.user_id).maybeSingle();
  const targetDays = dateDiffDays(setup?.target_exam_date, local.date);
  if (pref.countdown_milestones && pref.special_jace_messages && targetDays !== null && countdownMessages[targetDays] && inTargetWindow(local.time, pref.special_time)) {
    return { eventKey: `cele:${targetDays}:${local.date}`, title: targetDays >= 0 ? "A CELE note from Jace 💛" : "For you, My love. 💛", body: countdownMessages[targetDays], url: "/", localDate: local.date };
  }
  const preferred = (pref.preferred_time || setup?.reminder_time || "19:00").slice(0,5);
  if (!inTargetWindow(local.time, preferred)) return null;
  const restDays = Array.isArray(setup?.rest_days) ? setup.rest_days : [0];
  const studyDays = Array.isArray(setup?.study_days) ? setup.study_days : [1,2,3,4,5,6];
  if (pref.rest_day_suppression && restDays.includes(local.weekday)) return null;
  if (pref.due_review_reminders) {
    const { count } = await admin.from("adaptive_review_states").select("topic_slug", { count: "exact", head: true }).eq("user_id", pref.user_id).lte("next_due_at", now.toISOString());
    if ((count || 0) > 0) {
      return { eventKey: `due-review:${local.date}`, title: `${count} review${count === 1 ? "" : "s"} are due`, body: "A short spaced review is enough today, My love. No giant catch-up session needed. 💛", url: "/review/adaptive", localDate: local.date };
    }
  }
  if (pref.study_reminders && studyDays.includes(local.weekday)) {
    return { eventKey: `study:${local.date}`, title: "Today’s review is ready 💙", body: "Whenever you’re ready, My love. A small focused session still counts.", url: "/review", localDate: local.date };
  }
  return null;
}

export async function sendEventToUser(pref: CloudNotificationPreferences, event: NotificationEvent) {
  configureWebPush();
  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth").eq("user_id", pref.user_id);
  if (error) throw error;
  if (!subscriptions?.length) return { sent: 0, failed: 0 };
  let sent = 0, failed = 0;
  for (const row of subscriptions as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify({ title: event.title, body: event.body, url: event.url, tag: event.eventKey }));
      sent++;
    } catch (err: any) {
      failed++;
      if (err?.statusCode === 404 || err?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", row.id);
    }
  }
  const status = sent > 0 ? "sent" : "failed";
  await admin.from("notification_deliveries").upsert({ user_id: pref.user_id, event_key: event.eventKey, title: event.title, body: event.body, url: event.url, local_date: event.localDate, status, sent_at: sent > 0 ? new Date().toISOString() : null, failure_count: failed }, { onConflict: "user_id,event_key" });
  return { sent, failed };
}

export async function sendTestPushForUser(userId: string) {
  const pref: CloudNotificationPreferences = {
    user_id: userId, enabled: true, study_reminders: true, due_review_reminders: true,
    countdown_milestones: true, special_jace_messages: true, rest_day_suppression: true,
    preferred_time: "19:00", special_time: "08:00", quiet_start: "22:00", quiet_end: "07:00",
    max_daily_notifications: 10, timezone: "Asia/Manila",
  };
  const date = partsInTimeZone(new Date(), pref.timezone).date;
  return sendEventToUser(pref, { eventKey: `test:${Date.now()}`, title: "Kean I Help? 💛", body: "Push is working. Today’s review will only nudge you when it’s actually useful.", url: "/settings/notifications", localDate: date });
}
