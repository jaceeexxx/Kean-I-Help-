import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chooseNotificationEvent, sendEventToUser, type CloudNotificationPreferences } from "@/lib/notification-server";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("notification_preferences").select("*").eq("enabled", true);
    if (error) throw error;
    let sent = 0, failed = 0, eligible = 0;
    for (const pref of (data || []) as CloudNotificationPreferences[]) {
      const event = await chooseNotificationEvent(pref);
      if (!event) continue;
      eligible++;
      const result = await sendEventToUser(pref, event);
      sent += result.sent; failed += result.failed;
    }
    return NextResponse.json({ ok: true, usersChecked: data?.length || 0, eligible, sent, failed });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notification dispatch failed." }, { status: 500 });
  }
}
