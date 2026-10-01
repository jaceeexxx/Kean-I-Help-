# Kean I Help? — V2 Phase 2

## Authentication Gate, Onboarding, Profile & Settings

Version: `0.14.0`

This cumulative snapshot includes V2 Phase 1 plus the first complete account experience for the redesign.

### Added
- Brand-first `/welcome` screen.
- Private Supabase email/password `/sign-in` flow; no public registration UI.
- Password recovery and secure reset screens.
- Proxy-level protected-route gate. Signed-out users cannot render the normal app shell; authenticated users with incomplete setup are sent to onboarding.
- Six-step onboarding: personal opening, CELE target period/date, study rhythm, confidence, reminders, and the first Jace message.
- PRC exact date remains optional until officially published; `target_exam_period` stores the planned period separately.
- Responsive avatar account menu: bottom sheet on compact layouts, popover from the desktop sidebar.
- New `/profile` page with private avatar upload and Supabase Storage support.
- Split Settings architecture: Account, Study Plan, Notifications, Appearance, Accessibility, Data & Backup.
- Existing notification/data/account backends are preserved instead of reimplemented.

### Database
A new migration is included:

`supabase/migrations/0012_v2_auth_onboarding.sql`

It adds `target_exam_period`, `first_message_seen`, and `onboarding_version` to `cele_settings`.

After replacing an older local snapshot linked to the existing Kean I Help? Supabase project, apply it with:

```powershell
pnpm supabase db push
```

The onboarding save includes a compatibility fallback for an un-migrated database, but applying `0012` is the intended V2 setup.

### Verification

```powershell
pnpm run verify:v2phase2
pnpm run verify:phase12
pnpm run build
```
