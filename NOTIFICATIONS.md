# Phase 10 — Notifications & Push Setup

Kean I Help? uses standard **Web Push + Service Worker + VAPID**. Browser permission is requested only after Kean explicitly taps **Enable push**.

## Behavior

- Notifications default ON in product preferences, but browser/system permission is never requested automatically.
- Ordinary study reminders only run on planned study days.
- Protected rest days suppress ordinary study reminders.
- Due adaptive-review reminders take priority over generic study reminders.
- CELE milestones (30 / 14 / 7 / 1 / Day 1 / Day 2 / after Day 2) can use Jace's special copy.
- Quiet hours suppress scheduled messages.
- Default interruption cap is **1 notification per local calendar day**.
- Delivery rows make sending idempotent, so a 5-minute dispatcher does not duplicate notifications.

## Environment

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is intentionally public. The VAPID private key, Supabase service-role key, and Cron secret are server-only.

Generate VAPID keys with a trusted Web Push/VAPID tool (for example the `web-push` CLI) and keep the private key secret.

## Supabase

Apply `supabase/migrations/0010_notifications.sql` after Phase 9 migrations.

It creates:

- `notification_preferences`
- `push_subscriptions`
- `notification_deliveries`
- owner-only RLS policies
- a timezone field on `cele_settings`

## Dispatcher

Deploy the Next app first. Then schedule an HTTP `POST` to:

```text
https://YOUR_APP_DOMAIN/api/notifications/dispatch
```

with:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

Run it every **5 minutes**. The endpoint itself decides whether a user is actually due for a notification.

Supabase Cron can make scheduled HTTP requests. Store the deployed URL and secret using Supabase Vault or another secret store rather than putting secrets directly in migration SQL.

## iPhone / PWA note

Push support depends on browser/OS capabilities and requires a secure context. On iPhone/iPad, use the installed web app/PWA path supported by the device/browser. The settings screen reports whether Push is supported before enabling it.

## Testing

1. Sign in with the private Supabase email/password account.
2. Open **Today → Notifications**.
3. Tap **Enable push**.
4. Tap **Preview** for a local service-worker notification.
5. Tap **Test cloud push** to exercise VAPID + saved subscription.
6. Configure the dispatcher schedule and check **Recent Delivery History**.
