# Kean I Help? — V2 Phase 4

## Library + Study Desk

V2 Phase 4 turns Library into a source-first CELE study workspace while preserving every original upload.

### Included

- Private Supabase-backed Library with IndexedDB local-first fallback.
- Private `kean-library` Storage policies scoped to the authenticated user.
- Library upload organization by CELE area and optional topic.
- Upload/read/organize progress states.
- Native PDF text extraction using PDF.js.
- Page-aware extracted text with scanned/image-only page warnings.
- Original file, Study View, and personal Notes modes.
- Responsive Study Desk:
  - iPhone: one mode at a time with Document / Study / Notes tabs.
  - Tablet and desktop: original source beside Study View or Notes.
- Source-grounded Ask Jace handoff.
- Source-grounded generated study sessions and targeted practice.
- Saved Library materials integrated into Review → Saved.
- Library items included in Review search.
- Original uploads are never overwritten by derived study content.

### Database migration

Apply `supabase/migrations/0013_v2_library_study_desk.sql` after Phase 2's V2 migration.

It adds Library study metadata and private Storage RLS policies.

### Important source policy

The Library architecture remains:

`Original file → extracted/organized content → derived study experience`

Extraction, notes, AI study sessions, and exam preparation are all separate from the original upload.
