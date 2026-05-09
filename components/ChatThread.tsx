export type ChatLine = { role: "user" | "assistant"; content: string };

type ChatThreadProps = {
  messages: ChatLine[];
};

export function ChatThread({ messages }: ChatThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
        <p className="max-w-sm text-sm leading-relaxed">
          Say hello — Sunny will answer here after the model returns JSON from the
          server.
        </p>
      </div>
    );
  }

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
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider opacity-60">
              {m.role === "user" ? "You" : "Sunny"}
            </span>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
