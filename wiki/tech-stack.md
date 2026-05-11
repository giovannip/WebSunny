# Tech stack

**Summary**: Next.js 16 App Router, React 19, Tailwind CSS v4, Groq via the OpenAI TypeScript SDK, Zod validation, DotLottie player, and Web Speech–based voice features.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

- **Application framework**: Next.js **16.2.6** with the App Router (`app/`) (source: repository-overview-2026-05-11.md).
- **UI runtime**: React **19.2.4** with client components for chat, mic, and Lottie (source: repository-overview-2026-05-11.md).
- **Styling**: Tailwind CSS **v4** with PostCSS integration (source: repository-overview-2026-05-11.md).
- **LLM access**: `openai` package as an **OpenAI-compatible client** pointed at Groq’s base URL; model name from env with a documented default (source: repository-overview-2026-05-11.md).
- **Validation**: **Zod** for request bodies and model JSON shape on the server route (source: repository-overview-2026-05-11.md).
- **Character motion**: `@dotlottie/player-component` loads `.json` animations from `public/lottie/` (source: repository-overview-2026-05-11.md).
- **Speech input**: `react-speech-recognition` wrapper in `lib/use-sunny-speech-input.ts` (source: repository-overview-2026-05-11.md).
- **Tooling**: TypeScript 5, ESLint with `eslint-config-next` (source: repository-overview-2026-05-11.md).

## Related pages

- [[overview]]
- [[architecture-and-api]]
- [[browser-voice-and-speech]]
