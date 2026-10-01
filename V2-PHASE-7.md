# Kean I Help? — V2 Phase 7

## Ask Jace Tutor Workspace

Phase 7 rebuilds Ask Jace around the custom Jace sticker identity and makes it a contextual CELE study companion rather than a generic chat overlay.

### Included
- Jace sticker remains the navigation identity on mobile, tablet, and desktop.
- Contextual quick sheet from Home, Review, Lessons, Practice, Results, Progress, and Library.
- Dedicated `/jace` workspace with conversation history and `/jace/[conversationId]` routes.
- Mobile bottom-sheet behavior and a right-side companion panel on desktop.
- Conversation persistence is local-first, with best-effort synchronization to the existing `ask_jace_threads` and `ask_jace_messages` Supabase tables.
- Context can be attached from the 39-topic CELE curriculum or from readable Library materials.
- Existing lesson, question, material, mistake, and progress entry points continue to pass their exact context.
- Structured CE tutoring actions: explain, step-by-step, simplify, similar problem, why-wrong, and one-question-at-a-time quiz flow.
- Engineering response rendering supports section headings, lists, and KaTeX-rendered inline/display mathematics.
- Follow-up controls: Simpler, Step-by-step, Another example, and Quiz me.
- Useful answers can be saved to Review or copied into a Personal Note.
- Source-aware responses distinguish grounded material from general CE explanations.
- Ask Jace remains hidden during live Simulation runs.

### AI contract
The server route remains `POST /api/ask-jace` and continues to use OpenAI's Responses API. `OPENAI_API_KEY` remains server-only. `OPENAI_MODEL` stays configurable through environment variables.

The tutor instructions now request LaTeX delimiters for equations so the client can typeset them and prefer GIVEN / REQUIRED / CONCEPT / SOLUTION / ANSWER / CHECK for computational problems when useful.

### Data
No new Supabase migration is required for V2 Phase 7. The conversation tables from `0008_ask_jace_ai.sql` are used as-is. Local-first conversation storage keeps the workspace usable even when cloud synchronization is temporarily unavailable.

### New dependency
- `katex` for equation rendering
- `@types/katex` for TypeScript development

After replacing an older V2 snapshot with Phase 7, run `pnpm install` once so the new dependency is installed.
