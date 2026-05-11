# Configuration and environment

**Summary**: The web app requires `GROQ_API_KEY` and optionally `GROQ_MODEL`; `.env.example` documents additional Discord/OpenAI keys for an optional bot process not bundled in this working tree.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

## Web app

| Variable | Role |
|----------|------|
| `GROQ_API_KEY` | Required for `createGroqClient()`; missing key yields a configuration error on chat requests (source: repository-overview-2026-05-11.md). |
| `GROQ_MODEL` | Optional override; default **`llama-3.3-70b-versatile`** when unset (source: repository-overview-2026-05-11.md). |

Local development typically uses `.env.local` (gitignored pattern `.env*` in `.gitignore`; keep secrets out of git) (source: repository-overview-2026-05-11.md).

## Optional Discord / bot-related entries

`.env.example` lists `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, optional `DISCORD_GUILD_ID`, `OPENAI_API_KEY`, and optional `GROQ_TRANSCRIPTION_MODEL`, described as used by a **long-running bot**, not the Vercel-hosted web app (source: repository-overview-2026-05-11.md). This checkout snapshot does not include `discord-bot/` or `docs/` directories — **needs verification** if your fork adds them.

## Related pages

- [[overview]]
- [[architecture-and-api]]
- [[repository-structure]]
