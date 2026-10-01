# Ask Jace AI Architecture — V2 Phase 7

Ask Jace is the embedded Civil Engineering / CELE tutor inside **Kean I Help?**. The V2 interface uses the custom Jace sticker as the identity and exposes two complementary surfaces:

1. a contextual quick sheet / desktop companion panel opened from the Jace navigation sticker or from a lesson, question, material, result, or progress screen;
2. a dedicated `/jace` conversation workspace with local-first history and optional Supabase synchronization.

## Server architecture

Browser components call `POST /api/ask-jace`. The server route calls OpenAI's **Responses API**. `OPENAI_API_KEY` remains server-only and must never use a `NEXT_PUBLIC_` prefix. `OPENAI_MODEL` is configurable; the current default is `gpt-5.6`.

The current OpenAI model catalog supports GPT-5.6 models through the Responses API; keeping the model in environment configuration lets deployment change the model without editing UI code.

## Engineering response contract

Correctness and useful tutoring come before personality. For computational problems, Ask Jace is instructed to use a clear structure such as:

- GIVEN
- REQUIRED
- CONCEPT
- SOLUTION
- ANSWER
- CHECK

when that structure helps. Important equations use `$...$` or `$$...$$` delimiters and the browser renders them with KaTeX. Wide equations remain horizontally scrollable on compact screens.

When helping with an unanswered Practice question, the default behavior is hint/setup first rather than immediately revealing an answer letter. Simulation Mode never exposes Ask Jace.

## Context and grounding

`AskJaceContext` can represent:

- lesson
- exam question
- Library material
- CELE topic
- progress evidence

Readable Library materials are extracted locally and bounded before being sent as reference data. Source text is wrapped as untrusted reference material; instructions embedded inside uploaded documents must not override the tutor instructions.

Grounded answers surface the source title. Ungrounded responses are labeled as general CE explanations.

## Conversation persistence

`src/lib/jace-conversations.ts` stores conversations locally first under `kih:jace-conversations:v2`. It also performs best-effort synchronization with the existing RLS-protected Supabase tables:

- `ask_jace_threads`
- `ask_jace_messages`

If cloud sync fails, the local conversation remains usable. No new migration is required in V2 Phase 7.

## Saved learning artifacts

A useful Jace answer can be:

- saved to `Review → Saved → Jace Answers`;
- copied into a Personal Note in the Library.

The copied note is independent of conversation history so later note edits never mutate the original Jace conversation.
