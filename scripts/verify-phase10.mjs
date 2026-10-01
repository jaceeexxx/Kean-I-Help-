import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
const root=process.cwd();
const required=[
  "src/lib/notifications.ts","src/lib/push-client.ts","src/lib/notification-server.ts",
  "src/components/notifications/notification-settings.tsx","src/app/settings/notifications/page.tsx",
  "src/app/api/notifications/preferences/route.ts","src/app/api/notifications/subscribe/route.ts",
  "src/app/api/notifications/unsubscribe/route.ts","src/app/api/notifications/test/route.ts",
  "src/app/api/notifications/dispatch/route.ts","supabase/migrations/0010_notifications.sql",
  "NOTIFICATIONS.md","PHASE-10.md","proxy.ts"
];
for(const file of required) await access(resolve(root,file));
const sw=await readFile(resolve(root,"public/sw.js"),"utf8");
for(const token of ["push","notificationclick","showNotification","openWindow"]){if(!sw.includes(token))throw new Error(`Missing service-worker push behavior: ${token}`)}
const settings=await readFile(resolve(root,"src/components/notifications/notification-settings.tsx"),"utf8");
for(const token of ["Enable push","Study reminder","Due adaptive reviews","CELE milestone messages","Protect rest days","Quiet hours","Daily interruption limit","Test cloud push"]){if(!settings.includes(token))throw new Error(`Missing notification setting: ${token}`)}
const server=await readFile(resolve(root,"src/lib/notification-server.ts"),"utf8");
for(const token of ["countdownMessages","rest_day_suppression","quiet_start","max_daily_notifications","adaptive_review_states","404","410","due-review","study:"]){if(!server.includes(token))throw new Error(`Missing dispatcher behavior: ${token}`)}
const dispatch=await readFile(resolve(root,"src/app/api/notifications/dispatch/route.ts"),"utf8");
for(const token of ["CRON_SECRET","authorization","notification_preferences","chooseNotificationEvent","sendEventToUser"]){if(!dispatch.includes(token))throw new Error(`Missing protected dispatch behavior: ${token}`)}
const migration=await readFile(resolve(root,"supabase/migrations/0010_notifications.sql"),"utf8");
for(const token of ["notification_preferences","push_subscriptions","notification_deliveries","enable row level security","max_daily_notifications","timezone"]){if(!migration.includes(token))throw new Error(`Missing Phase 10 schema: ${token}`)}
const env=await readFile(resolve(root,".env.example"),"utf8");
for(const token of ["NEXT_PUBLIC_VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY","SUPABASE_SERVICE_ROLE_KEY","CRON_SECRET"]){if(!env.includes(token))throw new Error(`Missing notification environment setting: ${token}`)}
if(env.includes("NEXT_PUBLIC_VAPID_PRIVATE")||env.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE")||env.includes("NEXT_PUBLIC_CRON_SECRET"))throw new Error("A server notification secret was exposed as NEXT_PUBLIC_.");
const onboarding=await readFile(resolve(root,"src/components/onboarding/setup.tsx"),"utf8");
if(!onboarding.includes("signInWithPassword")||!onboarding.includes("No public registration")||!onboarding.includes("Study reminder"))throw new Error("Private email/password auth or reminder controls were not preserved.");
const today=await readFile(resolve(root,"src/components/today/today.tsx"),"utf8");
if(!today.includes("/settings/notifications")||!today.includes("ADAPTIVE FOCUS")||!today.includes("ADAPTIVE PLAN"))throw new Error("Today notification/adaptive bridge missing.");
const curriculum=await readFile(resolve(root,"src/lib/curriculum.ts"),"utf8");
const topics=(curriculum.match(/\{slug:"/g)||[]).length;
if(topics!==39)throw new Error(`Expected 39 CELE topic groups, found ${topics}`);
console.log("✓ 39 CELE topic groups preserved");
console.log("✓ Web Push service-worker receive/click flow present");
console.log("✓ Explicit push enable/disable + preview/test actions present");
console.log("✓ Study / due-review / CELE milestone scheduling rules present");
console.log("✓ Rest-day suppression, quiet hours, timezone, daily cap present");
console.log("✓ Protected Cron dispatcher + stale subscription cleanup present");
console.log("✓ Notification preferences/subscriptions/history RLS schema present");
console.log("✓ Private email/password auth + reminder onboarding path preserved");
console.log("✓ Phase 9 adaptive Today bridge preserved");
