"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { CharacterPanel } from "@/components/CharacterPanel";
import { ChatThread, type ChatLine } from "@/components/ChatThread";
import {
  reactionAnimationSchema,
  type ReactionAnimationId,
} from "@/lib/character-animations";
import {
  STT_LANG_OPTIONS,
  STT_LANG_STORAGE_KEY,
  useSunnySpeechInput,
} from "@/lib/use-sunny-speech-input";
import { useSunnyVoice } from "@/lib/use-sunny-voice";

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [voiceConversationActive, setVoiceConversationActive] = useState(false);
  const voiceConversationActiveRef = useRef(false);
  const restartListeningRef = useRef<() => void>(() => {});
  const [sttLang, setSttLang] = useState(() => {
    if (typeof window === "undefined") return "auto";
    try {
      return localStorage.getItem(STT_LANG_STORAGE_KEY) ?? "auto";
    } catch {
      return "auto";
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactionSeq, setReactionSeq] = useState(0);
  const [reactionAnimation, setReactionAnimation] =
    useState<ReactionAnimationId | null>(null);
  const { supported: voiceSupported, enabled: voiceEnabled, setEnabled: setVoiceEnabled, speak, cancel: cancelVoice } =
    useSunnyVoice();

  useEffect(() => {
    try {
      localStorage.setItem(STT_LANG_STORAGE_KEY, sttLang);
    } catch {
      /* ignore quota / private mode */
    }
  }, [sttLang]);

  useEffect(() => {
    voiceConversationActiveRef.current = voiceConversationActive;
  }, [voiceConversationActive]);

  const submitChat = useCallback(
    async (rawUserText: string) => {
      const trimmed = rawUserText.trim();
      if (!trimmed || loading) return;

      cancelVoice();
      setError(null);
      const nextUser: ChatLine = { role: "user", content: trimmed };
      const historyForApi = [...messages, nextUser];
      setMessages(historyForApi);
      setInput("");
      setLoading(true);

      const messagesPayload = historyForApi.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesPayload }),
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

        const replyLanguage =
          typeof data === "object" &&
          data !== null &&
          "replyLanguage" in data &&
          typeof (data as { replyLanguage: unknown }).replyLanguage === "string"
            ? (data as { replyLanguage: string }).replyLanguage
            : null;

        if (!reply || !animation || !replyLanguage) {
          throw new Error(
            "Resposta JSON incompleta (reply, animation ou replyLanguage)",
          );
        }

        const animParsed = reactionAnimationSchema.safeParse(animation);
        if (!animParsed.success) {
          throw new Error("Animação inválida na resposta do servidor");
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, replyLanguage },
        ]);
        setReactionAnimation(animParsed.data);
        setReactionSeq((n) => n + 1);
        speak(reply, replyLanguage);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Algo deu errado. Tente de novo.";
        setError(msg);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
        if (voiceConversationActiveRef.current) {
          restartListeningRef.current();
        }
      }
    },
    [cancelVoice, loading, messages, speak],
  );

  const handleNaturalUtterance = useCallback(
    (text: string) => {
      void submitChat(text);
    },
    [submitChat],
  );

  const {
    displayValue,
    listening,
    listeningSessionActive,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    toggleListening,
    finalizeListeningText,
    handleTextChange,
    beginListeningSession,
  } = useSunnySpeechInput({
    input,
    setInput,
    sttLangTag: sttLang,
    disabled: loading,
    onListenStart: cancelVoice,
    onNaturalUtterance: handleNaturalUtterance,
  });

  useEffect(() => {
    restartListeningRef.current = () => {
      void beginListeningSession("", { cancelAssistantVoice: false });
    };
  }, [beginListeningSession]);

  const send = useCallback(async () => {
    const raw = await finalizeListeningText();
    await submitChat(raw);
  }, [finalizeListeningText, submitChat]);

  const handleMicClick = useCallback(async () => {
    const stopping = listeningSessionActive || listening;
    if (stopping) {
      setVoiceConversationActive(false);
    } else {
      setVoiceConversationActive(true);
    }
    await toggleListening();
  }, [listening, listeningSessionActive, toggleListening]);

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
            {browserSupportsSpeechRecognition ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                {voiceConversationActive ? (
                  <span className="w-full text-[11px] text-amber-800/90 dark:text-amber-200/80">
                    Modo conversa: ao pausar a fala, a mensagem envia sozinha; o microfone volta em seguida.
                  </span>
                ) : null}
                <label htmlFor="stt-lang" className="shrink-0 font-medium">
                  Idioma do microfone
                </label>
                <select
                  id="stt-lang"
                  value={sttLang}
                  onChange={(e) => setSttLang(e.target.value)}
                  disabled={listening || loading}
                  className="max-w-[min(100%,220px)] rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {STT_LANG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span
                  className="min-w-0 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500"
                  title="O reconhecimento usa um idioma por vez. Automático segue o idioma do navegador."
                >
                  Se errar palavras, escolha o idioma em que você fala ou ajuste o idioma do sistema.
                </span>
              </div>
            ) : null}
            {!isMicrophoneAvailable && browserSupportsSpeechRecognition ? (
              <p
                className="text-xs text-amber-800 dark:text-amber-200/90"
                role="status"
              >
                Ative o acesso ao microfone para usar ditado por voz.
              </p>
            ) : null}
            <label htmlFor="chat-input" className="sr-only">
              Mensagem para a Sunny
            </label>
            <div className="flex gap-2">
              <textarea
                id="chat-input"
                rows={3}
                value={displayValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  voiceConversationActive
                    ? "Ou fale pelo microfone — a pausa envia a mensagem. Você ainda pode digitar."
                    : "Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)"
                }
                disabled={loading}
                className="min-w-0 flex-1 resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {browserSupportsSpeechRecognition ? (
                <button
                  type="button"
                  onClick={() => void handleMicClick()}
                  disabled={loading}
                  aria-pressed={listening || voiceConversationActive}
                  aria-label={
                    listeningSessionActive || listening
                      ? "Parar modo conversa por voz"
                      : "Iniciar modo conversa por voz"
                  }
                  title={
                    listeningSessionActive || listening
                      ? "Parar microfone"
                      : "Conversa por voz (pausa envia)"
                  }
                  className={`flex shrink-0 flex-col items-center justify-center gap-0.5 self-stretch rounded-xl border px-3 py-2 text-xs font-medium transition md:px-4 ${
                    listening || voiceConversationActive
                      ? "border-red-400 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100 dark:hover:bg-red-950/70"
                      : "border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6"
                    aria-hidden
                  >
                    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5.728-3a7.002 7.002 0 0 1-6 6.93V21h-1.5v-3.07a7.002 7.002 0 0 1-6-6.93h1.5a5.5 5.5 0 0 0 11 0h1.5Z" />
                  </svg>
                  <span className="hidden sm:inline">
                    {listening ? "A ouvir…" : "Conversa"}
                  </span>
                </button>
              ) : null}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !displayValue.trim()}
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
