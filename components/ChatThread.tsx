"use client";

export type ChatLine = { role: "user" | "assistant"; content: string };

type ChatThreadProps = {
  messages: ChatLine[];
  voiceSupported: boolean;
  voiceEnabled: boolean;
  onSpeakAssistant?: (text: string) => void;
};

export function ChatThread({
  messages,
  voiceSupported,
  voiceEnabled,
  onSpeakAssistant,
}: ChatThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
        <p className="max-w-sm text-sm leading-relaxed">
          Diga oi — a Sunny responde aqui quando você enviar uma mensagem.
        </p>
      </div>
    );
  }

  const showVoice = voiceSupported && voiceEnabled && onSpeakAssistant;

  return (
    <div className="flex max-h-[min(70vh,520px)] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {messages.map((m, i) => (
        <div
          key={`${m.role}-${i}`}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={
              m.role === "user"
                ? "max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-sm leading-relaxed text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "max-w-[85%] rounded-2xl rounded-bl-md border border-amber-200/90 bg-amber-50/90 px-4 py-2.5 text-sm leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-50"
            }
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-60">
                {m.role === "user" ? "Você" : "Sunny"}
              </span>
              {showVoice && m.role === "assistant" ? (
                <button
                  type="button"
                  onClick={() => onSpeakAssistant(m.content)}
                  className="shrink-0 rounded-md p-1 text-amber-800/80 transition hover:bg-amber-200/50 hover:text-amber-950 dark:text-amber-200/80 dark:hover:bg-amber-900/40 dark:hover:text-amber-50"
                  title="Ouvir de novo"
                  aria-label="Ouvir a resposta da Sunny em voz alta"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 1 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                    <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 1 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
