import { NextResponse } from "next/server";
import { createClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in before enabling cloud push." }, { status: 401 });
  const body = await request.json();
  const endpoint = String(body.endpoint || "");
  const p256dh = String(body.keys?.p256dh || "");
  const auth = String(body.keys?.auth || "");
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: data.user.id, endpoint, p256dh, auth, user_agent: request.headers.get("user-agent") || null, last_seen_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
