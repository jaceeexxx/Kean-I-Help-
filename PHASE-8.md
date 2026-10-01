# Phase 8 — Ask Jace AI Tutor & Material-Aware Study Generation

Status: **Complete in this package**

## Delivered

- Real Ask Jace bottom-sheet AI tutor replacing the Phase 7 preview
- Server-side OpenAI Responses API integration
- Server-only API key handling
- Configurable model through `OPENAI_MODEL`
- Free-form CE / CELE tutoring
- Context shortcuts:
  - Explain this
  - Simplify
  - Step-by-step
  - Similar problem
  - Quiz me
  - Why wrong?
- Lesson-aware Ask Jace actions
- Wrong-answer context from Daily Learn
- Practice-exam current-question context
- Simulation Mode AI lockout
- Result-page mistake explanation
- Progress-aware “what should I study next?”
- Library material grounding for text PDFs, TXT/Markdown, and written notes
- Material-generated Daily Learn flow
- Inline source labels for grounded material answers
- Save Ask Jace answers to Saved Review
- Save generated material study sessions to Saved Review
- Original Library source never overwritten
- Prompt-injection boundary for uploaded material
- Request/context/history size limits
- Cloud-ready Ask Jace thread/message/saved-review tables with owner-only RLS

## Deliberate limitations

- Image-only/scanned material is not silently OCR'd for AI grounding. If no text is extractable, the UI says so.
- Ask Jace does not browse the web from this app in Phase 8. Current code/regulation questions should still be checked against authoritative sources.
- AI responses are support, not an answer-key authority; deterministic exam keys remain separate.
