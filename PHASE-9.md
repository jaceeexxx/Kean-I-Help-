# Phase 9 — AI Study Intelligence & Adaptive Review

Status: **Complete in this package**

## Delivered

- Explainable adaptive priority across all 39 CELE topics
- Priority inputs: keyed accuracy, pace, CELE weight, due status, coverage, initial confidence
- Unkeyed questions affect pace/coverage only, never accuracy
- No fabricated mastery percentage for unmeasured topics
- Adaptive modes: baseline, remediation, targeted practice, speed drill, spaced review, mixed
- Time-bounded adaptive study-plan builder
- Adaptive Review page with top-priority queue
- Hard / Okay / Easy spaced-review scheduling
- Today adaptive focus + adaptive plan continuation
- Review adaptive focus + smarter Daily Learn recommendation
- Progress adaptive-priority explanation
- AI targeted-practice generation from performance evidence
- AI misconception-focused remediation
- Results → Build Targeted Remediation from an actual missed tagged question
- Library material → source-grounded targeted practice
- New AI practice/remediation artifacts saved into Saved Review
- Expanded Ask Jace actions for adaptive practice, remediation, and source practice
- Phase 9 cloud-ready RLS tables for adaptive review state + study plans
- Expanded `ai_review_items` kind constraint

## Boundaries

- Priority remains deterministic and auditable; AI only generates study content.
- Generated questions remain separate artifacts; they do not silently enter verified Past Exams.
- The spaced-review interval is a product heuristic, not a validated educational guarantee.
