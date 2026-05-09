import { ChatAssistant } from "@/components/ChatAssistant";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          WebSunny
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Groq-powered assistant — answers arrive as JSON, displayed here.
        </p>
      </header>
      <ChatAssistant />
    </div>
  );
}
