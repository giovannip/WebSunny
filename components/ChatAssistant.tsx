"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

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
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomDockRef = useRef<HTMLDivElement>(null);
  const [bottomDockHeight, setBottomDockHeight] = useState(400);
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

  useLayoutEffect(() => {
    const el = bottomDockRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setBottomDockHeight(Math.ceil(h));
    };

    measure();
    requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);

    const retryMs = [50, 150, 400, 800, 1600];
    const retryIds = retryMs.map((ms) => window.setTimeout(measure, ms));

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      retryIds.forEach(clearTimeout);
    };
  }, []);

  /** Reserva espaço extra para não sobrepor mensagens (medição async / Lottie). */
  const bottomDockInset = bottomDockHeight + 20;

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
    queueMicrotask(() => {
      chatInputRef.current?.focus();
    });
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
    <div className="relative flex min-h-[100dvh] flex-1 flex-col bg-gradient-to-br from-[#140822] via-[#231036] to-[#b45309] text-zinc-100">
      <header className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <div className="mx-auto flex w-full max-w-5xl items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Sunny
            </h1>
            <p className="text-xs text-white/60">
              Assistente com voz e microfone no navegador
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-2">
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatThread
              messages={messages}
              voiceSupported={voiceSupported}
              voiceEnabled={voiceEnabled}
              onSpeakAssistant={voiceSupported ? speak : undefined}
              dockInsetPx={bottomDockInset}
            />
          </div>

          {error ? (
            <p
              className="mt-2 shrink-0 rounded-xl border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-100 backdrop-blur-md"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        {/* Espaço equivalente ao dock fixo — mais fiável que só padding no flex */}
        <div
          className="shrink-0"
          style={{ height: bottomDockInset }}
          aria-hidden
        />
      </div>

      <div
        ref={bottomDockRef}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#140822]/95 backdrop-blur-xl supports-[backdrop-filter]:bg-[#140822]/85"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-5xl space-y-3 px-4 pt-3">
          <CharacterPanel
            reactionSeq={reactionSeq}
            reactionAnimation={reactionAnimation}
            avatarSizePx={136}
          />

          <div className="space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/10">
            {(voiceSupported || browserSupportsSpeechRecognition) ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {voiceSupported ? (
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/85">
                      <input
                        type="checkbox"
                        checked={voiceEnabled}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setVoiceEnabled(on);
                          if (!on) cancelVoice();
                        }}
                        className="h-3.5 w-3.5 shrink-0 rounded border-white/35 bg-black/20 text-amber-500 focus:ring-amber-500/40"
                      />
                      Voz da Sunny (Web Speech)
                    </label>
                  ) : null}
                  {browserSupportsSpeechRecognition ? (
                    <>
                      <label
                        htmlFor="stt-lang"
                        className="shrink-0 text-xs font-medium text-white/90"
                      >
                        Idioma do microfone
                      </label>
                      <select
                        id="stt-lang"
                        value={sttLang}
                        onChange={(e) => setSttLang(e.target.value)}
                        disabled={listening || loading}
                        className="min-w-0 max-w-[min(100%,280px)] flex-1 rounded-xl border border-white/20 bg-black/25 px-2.5 py-1.5 text-xs text-white focus:border-amber-400/80 focus:outline-none focus:ring-2 focus:ring-amber-500/35 disabled:opacity-60 sm:flex-initial"
                      >
                        {STT_LANG_OPTIONS.map((o) => (
                          <option
                            key={o.value}
                            value={o.value}
                            className="bg-zinc-900 text-white"
                          >
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}
                </div>
                {voiceConversationActive && browserSupportsSpeechRecognition ? (
                  <span className="text-[11px] text-amber-200/95">
                    Modo conversa: ao pausar a fala, a mensagem envia sozinha; o
                    microfone volta em seguida.
                  </span>
                ) : null}
              </div>
            ) : null}

            {!isMicrophoneAvailable && browserSupportsSpeechRecognition ? (
              <p
                className="text-xs text-amber-200/95"
                role="status"
              >
                Ative o acesso ao microfone para usar ditado por voz.
              </p>
            ) : null}

            <label htmlFor="chat-input" className="sr-only">
              Mensagem para a Sunny
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <textarea
                ref={chatInputRef}
                id="chat-input"
                rows={2}
                value={displayValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  voiceConversationActive
                    ? "Ou fale pelo microfone — a pausa envia a mensagem. Você ainda pode digitar."
                    : "Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)"
                }
                aria-busy={loading}
                className="min-h-[4.25rem] sm:min-h-[5rem] min-w-0 flex-1 resize-y rounded-xl border border-white/20 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-amber-400/80 focus:outline-none focus:ring-2 focus:ring-amber-500/35"
              />
              <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-col sm:items-stretch">
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
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-white transition sm:h-14 sm:w-full ${
                      listening || voiceConversationActive
                        ? "border-red-400/60 bg-red-950/50 hover:bg-red-950/70"
                        : "border-white/25 bg-white/10 hover:bg-white/15"
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
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={loading || !displayValue.trim()}
                  className="h-12 min-w-[7rem] shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 text-sm font-semibold text-white shadow-lg transition hover:from-amber-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-full"
                >
                  {loading ? "Pensando…" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
