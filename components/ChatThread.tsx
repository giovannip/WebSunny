"use client";

import { useLayoutEffect, useRef } from "react";

export type ChatLine =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; replyLanguage: string };

type ChatThreadProps = {
  messages: ChatLine[];
  voiceSupported: boolean;
  voiceEnabled: boolean;
  onSpeakAssistant?: (text: string, replyLanguage: string) => void;
  /** Altura reservada ao dock fixo — quando muda, volta a alinhar ao fim do histórico. */
  dockInsetPx?: number;
};

export function ChatThread({
  messages,
  voiceSupported,
  voiceEnabled,
  onSpeakAssistant,
  dockInsetPx = 0,
}: ChatThreadProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    const root = scrollRootRef.current;
    if (!root) return;
    const goEnd = () => {
      root.scrollTop = root.scrollHeight;
    };
    goEnd();
    requestAnimationFrame(() => {
      goEnd();
      requestAnimationFrame(goEnd);
    });
  }, [messages, dockInsetPx]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 px-6 py-14 text-center backdrop-blur-md">
        <p className="max-w-sm text-sm leading-relaxed text-white/75">
          Diga oi — a Sunny responde aqui quando você enviar uma mensagem.
        </p>
      </div>
    );
  }

  const showVoice = voiceSupported && voiceEnabled && onSpeakAssistant;

  return (
    <div
      ref={scrollRootRef}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1"
      style={{ scrollPaddingBottom: 12 }}
    >
      {messages.map((m, i) => (
        <div
          key={`${m.role}-${i}`}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={
              m.role === "user"
                ? "max-w-[88%] rounded-2xl rounded-br-md border border-white/20 bg-black/35 px-4 py-2.5 text-sm leading-relaxed text-white shadow-lg backdrop-blur-md"
                : "max-w-[88%] rounded-2xl rounded-bl-md border border-white/25 bg-white/15 px-4 py-2.5 text-sm leading-relaxed text-white shadow-lg backdrop-blur-md"
            }
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                {m.role === "user" ? "Você" : "Sunny"}
              </span>
              {showVoice && m.role === "assistant" ? (
                <button
                  type="button"
                  onClick={() =>
                    onSpeakAssistant(m.content, m.replyLanguage)
                  }
                  className="shrink-0 rounded-md p-1 text-amber-200/95 transition hover:bg-white/15 hover:text-white"
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
            <p className="whitespace-pre-wrap text-white/95">{m.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
