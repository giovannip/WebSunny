# WebSunny

**WebSunny** is a [Next.js](https://nextjs.org/) (TypeScript) web app featuring **Sunny**, a virtual assistant with a Shiba-inspired avatar. You chat in the browser; the server calls the [Groq](https://groq.com/) API (OpenAI-compatible, JSON mode), validates the response with [Zod](https://zod.dev/), and the UI shows the assistant reply, plays a **DotLottie** reaction, and can read the answer aloud with the **Web Speech API**. Optional microphone input uses the browser speech-recognition stack (`react-speech-recognition`).

Extended documentation lives in the project wiki: **[wiki/index.md](wiki/index.md)** (see also [AGENTS.md](AGENTS.md) for how `wiki/` and `raw/` are maintained).

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (recommended)
- A [Groq Console](https://console.groq.com/) account and API key

## Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a local env file from the example:

   ```bash
   cp .env.example .env.local
   ```

   On Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Edit `.env.local` and set:

   - **`GROQ_API_KEY`** — required ([create a key](https://console.groq.com/keys))
   - **`GROQ_MODEL`** — optional; defaults to `llama-3.3-70b-versatile` (see `lib/groq.ts`)

`.env.example` also lists **Discord** and **OpenAI** variables for a separate long-running bot-style process; they are **not** required for the Vercel web app in this repository layout.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server (default [http://localhost:3000](http://localhost:3000)) |
| `npm run build` | Production build |
| `npm start` | Run the production server (after `build`) |
| `npm run lint` | Run ESLint |

In the chat UI, **Enter** sends a message; **Shift+Enter** inserts a new line. Voice and microphone controls appear when the browser supports the relevant Web Speech features.

## Deploy on Vercel

1. Connect the repository to a [Vercel](https://vercel.com/) project.
2. Under **Project → Settings → Environment Variables**, add **`GROQ_API_KEY`** (and optionally **`GROQ_MODEL`**) for **Production** and **Preview**.
3. Deploy. Keep the API key on the server only (environment variables), never in client-side code.

## Repository layout

| Path | Description |
|------|-------------|
| `app/page.tsx` | Home page hosting the chat assistant |
| `app/api/chat/route.ts` | `POST` handler that calls Groq and returns `{ reply, animation, replyLanguage }` |
| `lib/groq.ts` | Groq OpenAI-compatible client and default model |
| `lib/prompts/character-system-prompt.ts` | Sunny system prompt and JSON shape instructions |
| `lib/character-animations.ts` | Allowed reaction IDs and Lottie file mapping |
| `components/` | `ChatAssistant`, `ChatThread`, `CharacterPanel` |
| `public/lottie/` | DotLottie JSON assets for idle and reactions |
| `wiki/` | Project wiki (start at `wiki/index.md`) |
| `raw/` | Immutable source notes for wiki ingest |

## License

Private project — see the repository for details.
