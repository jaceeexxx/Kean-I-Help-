# V2 Phase 3 — Home, Review & Lessons

This cumulative snapshot introduces the first major content-facing redesign of Kean I Help?. It keeps the V2 brand/auth foundation and the existing Supabase/PWA logic while rebuilding the Home and Review experience around the frozen v2 information architecture.

## Home

- editorial greeting and date treatment
- CELE countdown that uses the exact target date when known and the target period otherwise
- one dominant Today's Review action
- rest-day state with no guilt language
- compact Up Next list instead of dashboard-card clutter
- one daily Message from Jace using the sticker system
- evidence-only study snapshot using actual recorded activity

## Review

- Overview / Library / Saved review navigation
- topic-and-lesson search
- one Continue destination
- all three CELE areas with official 35 / 35 / 30 weighting labels
- all 39 topic groups preserved
- evidence-based topic status labels: Not started, Developing, Needs work, Strong
- dedicated area/topic hierarchy and topic detail route

## Lessons

- reading-first lesson layout with constrained reading width
- outcomes, core idea, formula, worked example, and check-yourself structure
- Jace note uses the V2 sticker asset rather than a generic J icon
- formula pinning preserved
- lesson completion persisted locally
- contextual Ask Jace actions preserved
- three starter lessons upgraded with worked examples and clearer learning outcomes

## Responsive behavior

- compact iPhone layouts stay single-column
- tablet/medium widths retain comfortable reading widths and remove unnecessary permanent panels
- desktop uses the existing persistent V2 sidebar plus a quiet lesson outline

## Library

A cleaner Library index route is included so the new Review navigation is complete. The full PDF Study Desk, split-pane material viewer, richer upload states, source organization, and Library-specific responsive redesign remain V2 Phase 4.

## Verify

```bash
pnpm run verify:v2phase1
pnpm run verify:v2phase2
pnpm run verify:v2phase3
pnpm run verify:phase12
pnpm run build
```
