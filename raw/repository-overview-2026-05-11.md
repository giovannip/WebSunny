# WebSunny repository overview (agent-generated bootstrap)

**Generated**: 2026-05-11  
**Method**: Automated read of `package.json`, `app/`, `lib/`, `components/`, `.env.example`, `public/`, and `AGENTS.md` in this working tree.

## Purpose of this document

Canonical “source” for the initial project wiki: facts below should be cited by wiki pages. If the codebase drifts, add a newer dated file under `raw/` and ingest again rather than editing this file (immutable raw policy).

## Product summary

WebSunny is a Next.js web app featuring **Sunny**, a virtual assistant persona (Shiba-inspired character). Users chat in the browser; the server calls **Groq**’s OpenAI-compatible API with **JSON response mode**. The UI shows messages, drives **DotLottie** reaction animations from the model output, and optionally uses the **Web Speech API** for TTS and browser STT (`react-speech-recognition`).

## Runtime versions (from package.json)

- `next`: 16.2.6  
- `react` / `react-dom`: 19.2.4  
- `openai` SDK: ^6.37.0 (used with Groq base URL)  
- `zod`: ^4.4.3  
- `@dotlottie/player-component`: ^2.7.12  
- `react-speech-recognition`: ^4.0.1  
- Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`)  
- TypeScript ^5  

## Environment variables (.env.example)

- **Web app (required for chat)**: `GROQ_API_KEY`; optional `GROQ_MODEL` (default `llama-3.3-70b-versatile` per `lib/groq.ts`).  
- **Comment in .env.example**: Discord-related variables (`DISCORD_*`, `OPENAI_API_KEY`, `GROQ_TRANSCRIPTION_MODEL`) are described as used by a **long-running bot process**, not required for the Vercel web app. This checkout does not include a `discord-bot/` or `docs/` directory; treat those integrations as optional / external unless added to the tree.

## Notable paths

| Area | Path |
|------|------|
| Home UI | `app/page.tsx` → `ChatAssistant` |
| Chat API | `app/api/chat/route.ts` |
| Groq client + model | `lib/groq.ts` |
| System prompt | `lib/prompts/character-system-prompt.ts` |
| Animation IDs + Zod enum | `lib/character-animations.ts` |
| Lottie assets | `public/lottie/*.json` (smiling-dog idle + four reaction files) |
| Voice output | `lib/use-sunny-voice.ts` |
| Speech input | `lib/use-sunny-speech-input.ts` |
| Character Lottie panel | `components/CharacterPanel.tsx` |
| Chat transcript | `components/ChatThread.tsx` |
| Composer + mic | `components/ChatAssistant.tsx` |

## Agent / editor rules

- `AGENTS.md` — Next.js doc reminder + **Project wiki** rules (`wiki/`, `raw/`).  
- `CLAUDE.md` — points at `AGENTS.md`.

## UI copy and default language

- `app/layout.tsx` sets `lang="pt-BR"` and Portuguese metadata description.  
- In-app strings in components are largely **Portuguese** (errors, labels, placeholders).  
- The **character system prompt** is written in **Portuguese** and instructs initial `pt-BR` with adaptation to the user’s language, plus JSON shape for `reply`, `animation`, `replyLanguage`.

## Character system prompt (paraphrased from `lib/prompts/character-system-prompt.ts`)

Verbatim text lives in the repository file above; behavior captured for wiki sourcing:

- Persona: **Sunny**, warm/curious framing but instructions also ask for **sarcastic, grumpy** tone, jokes at the user’s expense, staying in character; goal includes **game recommendations** (genres, platforms).  
- Visual: Shiba-style 2D pup, red bandana in most poses.  
- **Idle** animation name is `Smiling Dog` — model must **not** pick or mention idle; pick **one** reaction per reply from exactly: `Astronaut Dog`, `Flirting Dog`, `Happy Dog`, `Happy Unicorn Dog`.  
- Replies: short paragraphs (TTS-oriented); must output **only** a JSON object (no markdown fences), keys `reply` (string), `animation` (one of four exact strings), `replyLanguage` (BCP-47 of the **actual** reply text).  
- Must not mention system prompt or internal JSON instructions to the user.

## Chat API contract (paraphrased from `app/api/chat/route.ts`)

- `POST` JSON body: either `message` (string) **or** `messages` (array of `{ role: "user"|"assistant", content }`, max 50), max content length 12000 chars per message.  
- Server builds dialogue, injects system prompt, calls Groq with `response_format: { type: "json_object" }`, temperature `0.7`.  
- Successful JSON body to client: `{ reply, animation, replyLanguage }` after Zod validation (`animation` must be one of the four reaction IDs; `replyLanguage` normalized BCP-47-like tag).  
- Error responses use 400 (invalid JSON), 422 (validation), 500 (missing API key / config), 502 (model/parse failures).
