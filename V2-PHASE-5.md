# Kean I Help? — V2 Phase 5

## Practice + PRC Simulation

Phase 5 rebuilds the old Exam surface into the user-facing **Practice** workspace while keeping existing verified-paper parsing, attempt history, progress analytics, and local-first recovery compatible.

### Practice modes

- Quick Practice builds a short mixed set from verified question banks.
- Targeted Practice filters verified questions by CELE area and optional topic.
- Past Exams remain derived from original Library uploads; originals are not modified.
- Practice Mode allows keyed-answer feedback and contextual Ask Jace help.
- Simulation Mode hides answer feedback and Jace until submission.

### Current PRC CELE timing baseline

The configuration lives in `src/lib/simulation/cele-config.ts` rather than inside React components.

Current baseline: **PRC Board Resolution No. 01 (s. 2026)**, effective starting March 2026 and incorporated into subsequent schedules unless superseded.

- Principles of Structural Analysis and Design — 8:00 AM–2:00 PM — 6 hours — 35%.
- Applied Mathematics, Surveying, Principles of Transportation and Highway Engineering, Construction Management and Methods — 8:00 AM–1:00 PM — 5 hours — 35%.
- Hydraulics and Principles of Geotechnical Engineering — 2:00 PM–6:00 PM — 4 hours — 30%.
- The Resolution explicitly notes that the Structural block was extended to six hours for seventy-five (75) computation-heavy questions.

Official sources:
- https://www.prc.gov.ph/article/adjustments-order-subjects-be-administered-starting-march-2026-cele
- https://www.prc.gov.ph/sites/default/files/RevisedExamProgramMarch2026CivilEngg.pdf
- https://www.prc.gov.ph/sites/default/files/2026-01%20Adjustments%20To%20Be%20Administered%20Starting%20With%20The%20March%202026%20Civil%20Engineers%20Licensure%20Exam.pdf

If PRC publishes a superseding program, update the single configuration before treating later simulations as current.

### Timer reliability

Simulation timing no longer depends on decrementing a React counter. Every attempt persists:

- `startedAt`
- `expiresAt`
- `durationMinutes`
- simulation standard / PRC block
- answers
- flags
- current question
- per-question timing

Remaining time is recalculated from `expiresAt - Date.now()` on every tick and whenever the tab returns to focus/visibility. Closing the PWA, locking the phone, background throttling, refreshing, or losing the network therefore does not intentionally pause the exam clock.

At expiry, the saved attempt is automatically submitted and marked `autoSubmitted`.

### Responsive simulation UI

- iPhone / compact: single question view, fixed footer, full-height answer sheet.
- Tablet: wider reading surface with answer-sheet modal; layouts remain touch-first.
- Desktop: persistent question navigator, question workspace, session panel, and answer sheet.
- `Hide exam` obscures the paper but **does not pause the timer**.

### Compatibility

Legacy `/exam` URLs redirect to the corresponding `/practice` routes so existing local data and older links remain usable.

### Database

No Supabase migration is required for V2 Phase 5. Attempt recovery remains local-first; cloud/history integration continues through the existing app architecture.
