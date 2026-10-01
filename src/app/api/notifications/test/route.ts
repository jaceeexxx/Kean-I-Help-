import { NextResponse } from "next/server";
import { createClient, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { sendTestPushForUser } from "@/lib/notification-server";

export async function POST() {
  if (!isSupabaseServerConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { return NextResponse.json(await sendTestPushForUser(data.user.id)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Push test failed." }, { status: 500 }); }
}
