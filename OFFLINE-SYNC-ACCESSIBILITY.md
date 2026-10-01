# Phase 12 — Offline, Sync & Accessibility Hardening

## Offline contract

The service worker now caches only safe app-shell navigations and static application assets. It explicitly bypasses `/api/*` and `/auth/*` traffic and does not opportunistically cache Library-detail/result pages or signed originals.

Previously visited exam-run, lesson, and subject routes may be reused offline. Active exam answers are local-first and continue to autosave in browser storage. Ask Jace, new cloud uploads, push-management operations, and cloud account actions still require internet.

A dedicated `/offline` fallback explains those boundaries instead of showing a browser network error.

## Sync recovery

When the browser comes back online, `SyncRecovery` safely re-upserts the current local:

- CELE study preferences
- UI/theme/accessibility preferences
- Jace personality preferences
- local display name
- notification preferences

when Supabase is configured and an authenticated user exists. This recovery uses idempotent preference writes; it does not duplicate exams or Library originals.

## Accessibility hardening

- Keyboard-visible **Skip to main content** link
- stable `main#main-content` landmark
- live status announcements for offline/sync/update state
- strong `:focus-visible` treatment
- device + manual reduced-motion support
- manual text-scale support
- higher-contrast border/focus behavior when `prefers-contrast: more`
- forced-colors compatibility baseline
- coarse-pointer minimum height for core form/button controls
- no Jace/Bottom Nav overlay during live exam runs
- error/not-found screens offer clear recovery actions

## Remaining manual accessibility audit

Before gifting the production build, manually check VoiceOver on iPhone and TalkBack on Android for the full onboarding → Daily Learn → Exam → Results path, because assistive-technology behavior cannot be proven by static source checks alone.
