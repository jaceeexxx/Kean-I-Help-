# Phase 6 — Results, Analytics & Progress

Status: **Complete in this package**

## Delivered

- Attempt history instead of replacing the previous submitted result
- Per-question time tracking during Practice and Simulation
- CELE area + topic tags carried on verified questions
- Results page with score, answered count, pace, question-level timing
- Progress dashboard derived from submitted attempts
- Average score, best score, answered questions, average pace, active-day streak
- Score trend chart
- Structural / MSTE / HGE accuracy + pace cards
- Weakest-topic ranking
- Recent-attempt review journey
- Five milestone rules
- **Build Tomorrow's Review** plan generator
- Tomorrow plan shown back on Today
- Review plan favors weakest scored topics plus mistake replay
- Phase 6 Supabase schema for per-question timing, review plans and milestone events
- No arbitrary mastery percentages: metrics are derived from real scored attempts

## Metric behavior

Accuracy only uses questions that have an answer key. Topic and CELE-area cards only use questions tagged during verification. Timing uses the time accumulated while each question is open. If an uploaded exam has no answer key, the app still tracks completion and time but does not invent a score.
