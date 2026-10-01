# Phase 9 Adaptive Review Method

Phase 9 deliberately separates **priority selection** from **AI content generation**.

## Deterministic priority inputs

Each CELE topic receives an explainable priority score from:

- observed accuracy from submitted, answer-keyed exam questions;
- observed average time per answered question;
- the official CELE area weight (35% / 35% / 30%);
- whether the topic is due or overdue for review;
- whether the topic has no exam evidence yet (coverage gap);
- onboarding confidence only as a small boost for unmeasured topics.

No hidden AI model invents a mastery percentage. If a topic has no keyed evidence, the UI says **No keyed score yet**.

The weighted priority formula in `src/lib/adaptive.ts` is:

`0.52 × weakness + 0.13 × pace + 0.20 × due + 0.10 × coverage + 0.05 × initial-confidence boost`

then scaled by the CELE area's official weight relative to the 35% areas.

## Adaptive modes

- `baseline` — no trusted keyed evidence yet;
- `remediation` — keyed accuracy below 60%;
- `targeted-practice` — keyed accuracy from 60–79%;
- `speed-drill` — accuracy is acceptable but average pace is above 120 seconds/question;
- `spaced-review` — healthier performance, but the topic is due again;
- `mixed` — keep an already healthier topic active.

## Spaced review

After a review, Kean can rate it:

- **Hard** → review again in 1 day;
- **Okay** → grow the interval roughly 1.8×, minimum 2 days;
- **Easy** → grow the interval roughly 2.6×, minimum 4 days.

This is intentionally simple and transparent rather than pretending to be a scientifically validated forgetting-curve model.

## AI's role

Ask Jace receives the selected topic + performance evidence and can generate:

- five-question targeted CELE practice;
- misconception-focused remediation;
- source-grounded practice from uploaded materials.

AI does **not** decide the priority ranking and cannot change submitted exam history.
