# Architecture and API

**Summary**: The home route renders `ChatAssistant`, which calls `POST /api/chat` with message history; the route talks to Groq with a fixed system prompt and returns validated `{ reply, animation, replyLanguage }`.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

## Routing and layout

- `app/page.tsx` mounts `ChatAssistant` inside a full-height flex column (source: repository-overview-2026-05-11.md).
- `app/layout.tsx` applies Geist fonts, global CSS, and sets HTML `lang` to `pt-BR` (source: repository-overview-2026-05-11.md).

## Chat pipeline

1. Client accumulates `ChatLine` history and `POST`s `{ messages: [...] }` to `/api/chat` (source: repository-overview-2026-05-11.md).
2. Server validates input (single `message` or `messages` array, length limits) (source: repository-overview-2026-05-11.md).
3. Server instantiates the Groq client (`GROQ_API_KEY`), sends `system` + dialogue, **`response_format: json_object`**, `temperature: 0.7` (source: repository-overview-2026-05-11.md).
4. Server parses JSON and validates **`reply`**, **`animation`** (one of four reaction strings), **`replyLanguage`** (normalized tag) before returning 200 (source: repository-overview-2026-05-11.md).
5. Client updates transcript, triggers **reaction animation** + **TTS** using returned fields (source: repository-overview-2026-05-11.md).

## HTTP contract (errors)

- **400** — malformed JSON body.  
- **422** — Zod validation failure on request.  
- **500** — missing/invalid server configuration (e.g. API key).  
- **502** — upstream model failure, empty content, invalid JSON, or JSON not matching the expected Zod schema (source: repository-overview-2026-05-11.md).

## Related pages

- [[overview]]
- [[tech-stack]]
- [[sunny-persona-and-prompt]]
- [[character-animations]]
- [[browser-voice-and-speech]]
- [[configuration-and-env]]
