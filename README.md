# Kean I Help?

**For Kean, by Jace.**

V2 Phase 8 is the final cumulative redesign snapshot.

## V2 status

- **Phase 1:** brand assets + responsive app shell.
- **Phase 2:** private auth gate, first launch, onboarding, profile and settings.
- **Phase 3:** editorial Home, Review workspace, 39-topic hierarchy and reading-first lessons.
- **Phase 4:** Library + responsive Study Desk, PDF extraction, Saved/Search integration.
- **Phase 5:** Practice + PRC-timed Simulation, absolute-deadline timer, answer sheet and recovery.
- **Phase 6:** evidence-first Results, Progress, mistakes, history and Adaptive Review.
- **Phase 7:** sticker-based Ask Jace, full tutor workspace, contextual grounding and equation rendering.
- **Phase 8:** final responsive QA, accessibility hardening, PWA/privacy polish and launch contracts.

## Local setup

```bash
pnpm install
pnpm supabase db push
pnpm run verify:v2phase8
pnpm run test:simulation-clock
pnpm run verify:phase12
pnpm run build
pnpm start
```

In another terminal, with the production-like local server running:

```bash
pnpm run test:e2e:final
```

Before production deployment:

```bash
pnpm run check:env
```

## Supabase migrations

The cumulative V2 project includes the original migrations plus:

- `0012_v2_auth_onboarding.sql`
- `0013_v2_library_study_desk.sql`

Apply the migration chain once to the linked **Kean I Help?** Supabase project with `pnpm supabase db push`.

## Final responsive targets

Acceptance testing explicitly covers compact iPhone widths, 390/393px iPhone layouts, 430px large iPhone, tablet portrait, tablet landscape and 1280–1440px+ desktop workspaces. Layout behavior is based on available space, so iPad Split View/narrow windows should also be checked.

## Release priorities

The final release is blocked if any of these fail:

- private auth gate and onboarding restoration
- Supabase cloud write/read for profile and Library
- installed-PWA safe areas/update behavior
- Simulation absolute-deadline timer, autosave, recovery and auto-submit
- Practice vs Simulation help restrictions
- responsive navigation/shell contracts
- Ask Jace context/equation behavior
- accessibility preferences and keyboard focus

See `V2-PHASE-8.md` and `V2-FINAL-LAUNCH-CHECKLIST.md` for the final QA checklist.
