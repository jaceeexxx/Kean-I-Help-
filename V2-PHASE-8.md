# Kean I Help? — V2 Phase 8

## Final Responsive QA + PWA Polish

Phase 8 is the final cumulative V2 delivery. It hardens the already-built V2 experience rather than adding a new top-level feature.

### Final polish added
- Clean V2 global baseline: warm Paper background; no legacy SaaS radial-gradient shell.
- System/light/dark theme parity, including installed-PWA theme-color updates.
- Accessibility preferences now include larger text, reduced motion, higher contrast and always-underlined text links.
- `prefers-reduced-motion`, `prefers-contrast`, forced-colors, coarse-pointer, print and standalone-PWA safeguards.
- Versioned service-worker caches with explicit API/auth exclusions.
- Private navigation cache is cleared on sign-out/account deletion.
- User-visible service-worker update state has a Refresh action.
- Push notifications use the V2 branded app icon assets.
- Final Cypress contracts for iPhone, iPad/tablet, desktop, accessibility preferences and PWA privacy/install behavior.

### Responsive QA targets
- 375×667 — compact iPhone baseline
- 390×844 — current common iPhone baseline
- 768×1024 — iPad/tablet portrait
- 1024×768 — tablet landscape / expanded shell
- 1440×900 — desktop workspace

Breakpoints are still behavior-driven: components may adapt to available width rather than device identity.

### Release-blocking checks
- `pnpm run verify:v2phase8`
- `pnpm run test:simulation-clock`
- `pnpm run build`
- `pnpm run test:e2e:final` with the production-like local server running
- installed-PWA test on iOS and at least one desktop browser
- Supabase sign-in/onboarding/profile/library cloud round-trip
- offline Practice/Simulation recovery and timer expiry

No new Supabase migration is introduced in Phase 8.
