"use client";

import { useCallback, useState, type KeyboardEvent } from "react";

import { CharacterPanel } from "@/components/CharacterPanel";
import { ChatThread, type ChatLine } from "@/components/ChatThread";
import {
  reactionAnimationSchema,
  type ReactionAnimationId,
} from "@/lib/character-animations";
import { useSunnyVoice } from "@/lib/use-sunny-voice";

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactionSeq, setReactionSeq] = useState(0);
  const [reactionAnimation, setReactionAnimation] =
    useState<ReactionAnimationId | null>(null);
  const { supported: voiceSupported, enabled: voiceEnabled, setEnabled: setVoiceEnabled, speak, cancel: cancelVoice } =
    useSunnyVoice();

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    cancelVoice();
    setError(null);
    const nextUser: ChatLine = { role: "user", content: trimmed };
    const historyForApi = [...messages, nextUser];
    setMessages(historyForApi);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi }),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Falha na requisição (${res.status})`;
        throw new Error(errMsg);
      }

      const reply =
        typeof data === "object" &&
        data !== null &&
        "reply" in data &&
        typeof (data as { reply: unknown }).reply === "string"
          ? (data as { reply: string }).reply
          : null;

      const animation =
        typeof data === "object" &&
        data !== null &&
        "animation" in data &&
        typeof (data as { animation: unknown }).animation === "string"
          ? (data as { animation: string }).animation
          : null;

      if (!reply || !animation) {
        throw new Error("Resposta JSON incompleta (reply ou animation)");
      }

      const animParsed = reactionAnimationSchema.safeParse(animation);
      if (!animParsed.success) {
        throw new Error("Animação inválida na resposta do servidor");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setReactionAnimation(animParsed.data);
      setReactionSeq((n) => n + 1);
      speak(reply);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Algo deu errado. Tente de novo.";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [cancelVoice, input, loading, messages, speak]);

  const onKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      void send();
    }
  };

  return (
    <>
      <CharacterPanel
        reactionSeq={reactionSeq}
        reactionAnimation={reactionAnimation}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-[max(11rem,env(safe-area-inset-bottom))] pt-6 md:gap-8 md:px-8 md:pb-[max(12rem,env(safe-area-inset-bottom))] md:pt-8">
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {voiceSupported ? (
            <div className="flex items-center justify-end gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setVoiceEnabled(on);
                    if (!on) cancelVoice();
                  }}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500/30 dark:border-zinc-600"
                />
                Voz da Sunny (Web Speech)
              </label>
            </div>
          ) : null}
          <ChatThread
            messages={messages}
            voiceSupported={voiceSupported}
            voiceEnabled={voiceEnabled}
            onSpeakAssistant={voiceSupported ? speak : undefined}
          />
          {error ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Mensagem para a Sunny
            </label>
            <textarea
              id="chat-input"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)"
              disabled={loading}
              className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="rounded-full bg-amber-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {loading ? "Pensando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
