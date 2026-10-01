import { NextResponse } from "next/server";
import { createClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

async function userClient() {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export async function GET() {
  const ctx = await userClient();
  if (!ctx) return NextResponse.json({ error: "Sign in required for cloud notification sync." }, { status: 401 });
  const [{ data: preferences, error }, { data: history }] = await Promise.all([
    ctx.supabase.from("notification_preferences").select("*").eq("user_id", ctx.user.id).maybeSingle(),
    ctx.supabase.from("notification_deliveries").select("id,event_key,title,body,status,sent_at,local_date").eq("user_id", ctx.user.id).order("created_at", { ascending: false }).limit(8),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ preferences, history: history || [] });
}

export async function POST(request: Request) {
  const ctx = await userClient();
  if (!ctx) return NextResponse.json({ error: "Sign in required for cloud notification sync." }, { status: 401 });
  const body = await request.json();
  const row = {
    user_id: ctx.user.id,
    enabled: Boolean(body.enabled), study_reminders: Boolean(body.studyReminders), due_review_reminders: Boolean(body.dueReviewReminders),
    countdown_milestones: Boolean(body.countdownMilestones), special_jace_messages: Boolean(body.specialJaceMessages), rest_day_suppression: Boolean(body.restDaySuppression),
    preferred_time: String(body.preferredTime || "19:00"), special_time: String(body.specialTime || "08:00"), quiet_start: String(body.quietStart || "22:00"), quiet_end: String(body.quietEnd || "07:00"),
    max_daily_notifications: Math.max(1, Math.min(3, Number(body.maxDailyNotifications) || 1)), timezone: String(body.timezone || "Asia/Manila"), updated_at: new Date().toISOString(),
  };
  const { error } = await ctx.supabase.from("notification_preferences").upsert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
