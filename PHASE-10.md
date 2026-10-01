# Phase 10 — Notifications, Reminders & Special-Date Messaging

Status: **Complete in this package**

Delivered:

- Notification Settings page reachable from Today
- explicit Web Push permission flow
- service-worker `push` and `notificationclick` handling
- VAPID subscription / unsubscribe APIs
- authenticated Supabase subscription storage
- local preview notification even before cloud scheduling
- cloud push test action
- master notification toggle
- planned study reminders
- adaptive due-review reminders
- CELE countdown milestone messages
- special Jace messaging for milestone dates
- automatic protected-rest-day suppression
- configurable study reminder and special-message times
- configurable quiet hours
- timezone-aware scheduling
- default one-notification-per-day interruption cap
- recent delivery history
- idempotent delivery keys
- stale subscription cleanup on 404/410 push responses
- protected Cron dispatcher
- owner-only RLS tables for preferences/subscriptions/history
- private Supabase email/password auth path for secure device ownership
- Phase 9 adaptive flow preserved

The app does **not** attempt to schedule browser notifications with `setTimeout()` and pretend they work while the app is closed. Production delivery uses Web Push and a scheduled server dispatcher.
