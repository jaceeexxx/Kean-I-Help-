# Personalize Jace Before Kean Gets the App

Phase 7 deliberately separates **personality copy** from the reaction engine.
You can replace Jace's words without changing any behavior or components.

Primary file:

`src/content/jace-content.ts`

## Replace with Jace's real words

- `firstMessageFromJace` — the onboarding message Kean sees before entering.
- `dailyMessages` — exactly one stable message is selected for each calendar day.
- `dailyGreetings` — every greeting should continue ending in **“My love.”**
- `countdownMessages` — special overrides at 30, 14, 7, 1, CELE Day 1, CELE Day 2, and after the two exam days.
- `lessonNotes` — tiny comments inside Daily Learn.
- `reactionLines` — short talking-sticker lines for learning, results, milestones, plans, and returning after rest.

## Tone guardrails already enforced by the design

- Serious information appears before Jace reactions on Results.
- No sticker is rendered while the actual exam player is open.
- Low scores use repair/support language, never ridicule.
- Planned rest days never create guilt or streak-shaming copy.
- Jace reactions disappear automatically and can also be dismissed.
- Sound is **off by default**; Phase 7 uses a visual speech bubble rather than surprise audio.
