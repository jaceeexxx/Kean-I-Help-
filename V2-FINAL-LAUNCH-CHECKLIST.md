# Kean I Help? — V2 Final Launch Checklist

## Database and auth
- Apply all migrations through `0013_v2_library_study_desk.sql`.
- Confirm public sign-up is disabled in Supabase.
- Confirm Kean's existing account signs in and restores after refresh.
- Confirm unfinished onboarding redirects to `/onboarding`; completed onboarding redirects to Home.
- Confirm password-reset redirect works on both local and production URLs.

## Environment
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Set the production `NEXT_PUBLIC_SITE_URL`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET` server-only.
- Run `pnpm run check:env` before production deployment.

## Build and automated checks
- `pnpm install`
- `pnpm run verify:v2phase1` through `pnpm run verify:v2phase8`
- `pnpm run verify:phase12`
- `pnpm run test:simulation-clock`
- `pnpm run build`
- Start production locally with `pnpm start`, then run `pnpm run test:e2e:final` in another terminal.

## Responsive acceptance
- iPhone compact width: 375px.
- iPhone baseline: 390/393px.
- Large iPhone: 430px.
- Tablet portrait: 768px.
- Tablet landscape: 1024px.
- Desktop: 1280px and 1440px+.
- Check portrait/landscape rotation and iPad Split View/narrow windows.
- No clipped formulas, dialogs, nav controls or Jace stickers.

## Installed PWA
- Install on iPhone Home Screen and verify standalone launch.
- Confirm safe-area spacing above the Home indicator/notch.
- Confirm app icon and maskable icon render clearly.
- Confirm update-ready banner can refresh to the new service worker.
- Confirm sign-out clears private navigation cache.
- Confirm offline fallback never exposes API/auth responses.

## Practice and PRC Simulation
- Practice keeps hints/explanations/Ask Jace.
- Simulation removes Jace, hints and pre-submit explanations.
- PRC baseline remains 6h Structural, 5h MSTE, 4h HGE until superseded by PRC.
- Timer uses absolute `expiresAt`, survives reload/background/sleep, and auto-submits at zero.
- Answer choice, flags, current question and timing survive reload/reopen.
- Review & Submit identifies unanswered and flagged items.

## Ask Jace
- Add the server-only `OPENAI_API_KEY` before enabling AI in production.
- Verify equations render with KaTeX on narrow phones and desktop.
- Verify lesson/question/material/progress context labels are accurate.
- Confirm Jace is unavailable during live Simulation.

## Accessibility
- Keyboard skip link reaches `#main-content`.
- 200% browser zoom remains usable on desktop.
- Larger Text doesn't clip controls.
- Reduced Motion removes decorative motion.
- Higher Contrast and Always Underline Links work.
- Screen-reader labels exist for icon-only controls.
- All essential actions work without hover.

## Final manual smoke
- Sign in → Home → Review → Lesson → Practice → Results → Progress.
- Upload PDF → Study Desk → Notes → Ask Jace.
- Profile photo → Settings → Study Plan → Appearance → Accessibility.
- Sign out → sign back in → cloud state remains correct.
