# WebSunny overview

**Summary**: WebSunny is a Next.js web app centered on **Sunny**, a virtual assistant with a Shiba-inspired avatar, Groq-backed chat in structured JSON, DotLottie reactions, and optional browser speech I/O.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

WebSunny delivers a single-page chat experience: the user types or dictates in the browser, the client sends dialogue to a **server route** (`POST /api/chat`), and the model returns assistant text plus metadata (`animation`, `replyLanguage`) that the UI uses for **Lottie** playback and **text-to-speech** selection (source: repository-overview-2026-05-11.md).

The product tone and goals (game tips, sarcastic persona) are defined in the **system prompt**; the API validates model JSON with **Zod** before responding to the client (source: repository-overview-2026-05-11.md).

Optional **Discord / OpenAI** variables appear in `.env.example` for a separate long-running bot workflow and are **not** required to run the web app on Vercel in this tree (source: repository-overview-2026-05-11.md).

## Related pages

- [[tech-stack]]
- [[architecture-and-api]]
- [[sunny-persona-and-prompt]]
- [[character-animations]]
- [[browser-voice-and-speech]]
- [[configuration-and-env]]
- [[repository-structure]]
