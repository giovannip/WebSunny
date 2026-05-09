export function CharacterPanel() {
  return (
    <aside className="flex shrink-0 flex-col gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/30 md:w-72">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-inner ring-2 ring-amber-300/60 dark:bg-zinc-900 dark:ring-amber-700/50"
          aria-hidden
        >
          ☀️
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-amber-950 dark:text-amber-100">
            Sunny
          </h2>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/70">
            Your cheerful web assistant
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-amber-950/85 dark:text-amber-100/80">
        I read what you type, think with Groq&apos;s LLM on the server, and answer
        as JSON — you only see the friendly reply.
      </p>
    </aside>
  );
}
