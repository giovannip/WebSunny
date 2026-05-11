# Repository structure

**Summary**: Key directories for the Next app are `app/`, `components/`, `lib/`, `public/` (including `lottie/`), plus `wiki/` and `raw/` for documentation workflow; `assets/` holds design mock PNGs.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

| Path | Role |
|------|------|
| `app/page.tsx` | Home page shell hosting `ChatAssistant` (source: repository-overview-2026-05-11.md). |
| `app/api/chat/route.ts` | Groq-backed chat endpoint and Zod validation (source: repository-overview-2026-05-11.md). |
| `lib/groq.ts` | Groq client factory and default model constant (source: repository-overview-2026-05-11.md). |
| `lib/prompts/` | Character system prompt source (source: repository-overview-2026-05-11.md). |
| `lib/character-animations.ts` | Animation IDs, URLs, Zod enum (source: repository-overview-2026-05-11.md). |
| `components/` | `ChatAssistant`, `ChatThread`, `CharacterPanel` (source: repository-overview-2026-05-11.md). |
| `public/lottie/` | DotLottie JSON assets for idle + reactions (source: repository-overview-2026-05-11.md). |
| `assets/` | UI mock images (proposals); not wired into runtime bundle by default (source: repository-overview-2026-05-11.md). |
| `wiki/` | Project wiki pages maintained per `AGENTS.md` (source: repository-overview-2026-05-11.md). |
| `raw/` | Immutable source notes for wiki ingest (source: repository-overview-2026-05-11.md). |

## Related pages

- [[overview]]
- [[architecture-and-api]]
- [[configuration-and-env]]
