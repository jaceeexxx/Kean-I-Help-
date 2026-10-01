import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/welcome",
  "/sign-in",
  "/forgot-password",
  "/auth/reset-password",
  "/offline",
]);

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  return to;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/") || pathname === "/auth/callback") {
    await supabase.auth.getClaims();
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isPublic = PUBLIC_PATHS.has(pathname);
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!user) {
    if (isPublic) return response;
    const introSeen = request.cookies.get("kih-intro-seen")?.value === "1";
    const destination = introSeen ? "/sign-in" : "/welcome";
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    return copyCookies(response, redirect);
  }

  let onboardingComplete = false;
  try {
    const { data } = await supabase
      .from("cele_settings")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();
    onboardingComplete = Boolean(data?.onboarding_completed);
  } catch {
    // If the settings lookup is temporarily unavailable, authenticated pages stay reachable.
    onboardingComplete = true;
  }

  if ((pathname === "/welcome" || pathname === "/sign-in" || pathname === "/forgot-password") && user) {
    const destination = onboardingComplete ? "/" : "/onboarding";
    return copyCookies(response, NextResponse.redirect(new URL(destination, request.url)));
  }

  if (!onboardingComplete && !isOnboarding && pathname !== "/auth/reset-password" && !isPublic) {
    return copyCookies(response, NextResponse.redirect(new URL("/onboarding", request.url)));
  }

  if (onboardingComplete && isOnboarding) {
    return copyCookies(response, NextResponse.redirect(new URL("/", request.url)));
  }

  return response;
}
