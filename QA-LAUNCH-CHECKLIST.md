# Phase 12 — QA & Launch Checklist

## Automated gates

Run:

```bash
npm install
npm run verify:phase12
npm run lint
npm run build
npm run test:e2e
```

For production secrets/configuration:

```bash
npm run check:env
```

## Cypress smoke coverage

- Today renders after a seeded completed setup
- four primary navigation destinations exist
- skip-link/main landmark contract
- Review / Exam / Progress / Settings smoke routes
- Simulation hides Ask Jace and the normal bottom nav
- selected exam answer persists through reload
- dedicated offline fallback exists
- service worker explicitly bypasses API caching

## Manual release matrix

### iPhone PWA
- Safari → Add to Home Screen
- launch in standalone mode
- safe-area spacing around top/bottom controls
- Practice and Simulation orientation/scroll behavior
- close/reopen unfinished exam and confirm autosave recovery
- toggle Airplane Mode after visiting Today/Review/Exam and verify offline fallback/local state
- enable Web Push from explicit button and send cloud test
- VoiceOver traversal and rotor headings/links

### Android / Chrome PWA
- Install app
- standalone launch
- back-navigation behavior
- offline transition/reconnection banner
- push subscribe/test/click-through
- TalkBack focus order

### Desktop Chrome
- keyboard-only traversal
- skip link
- visible focus states
- exam keyboard/tab order
- resize from narrow mobile width through desktop
- dark/light/system appearance
- reduced motion + large text

## Production operational checks

- run Supabase migrations through Phase 11/notification schema in order
- verify private `kean-library` and `kean-profile` buckets
- verify private email/password sign-in on production
- configure VAPID keys and Cron dispatcher secret
- configure scheduled notification dispatcher
- configure `OPENAI_API_KEY` server-side only
- verify account export/delete route using a disposable test account
- verify backups before enabling real deletion for Kean
- confirm monitoring/logging at hosting + Supabase level

## Release rule

Do not ship if any of these fail: sign-in, exam autosave/resume, Simulation timer, original Library access, account deletion boundary, private-secret scan, push subscription, or mobile PWA install.
