"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

/** localStorage key — kept in sync by ChatAssistant when the user changes the STT language. */
export const STT_LANG_STORAGE_KEY = "websunny-stt-lang";

export const STT_LANG_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Automático (navegador)" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "it-IT", label: "Italiano" },
  { value: "ja-JP", label: "日本語" },
  { value: "zh-CN", label: "中文 (简体)" },
];

function normalizeLangTag(lang: string): string {
  return lang.trim().replace(/_/g, "-").toLowerCase();
}

/** BCP-47 tag for Web Speech recognition — browser default when `sttLangTag` is auto/empty. */
export function resolveRecognitionLang(sttLangTag: string): string {
  if (typeof window === "undefined") return "pt-br";
  const t = sttLangTag.trim().toLowerCase();
  const manual =
    t && t !== "auto"
      ? sttLangTag.trim()
      : "";
  const raw =
    manual ||
    navigator.language ||
    (navigator.languages && navigator.languages[0]) ||
    "pt-BR";
  return normalizeLangTag(raw) || "pt-br";
}

/** Options for {@link useSunnySpeechInput}'s `beginListeningSession`. */
export type BeginListeningSessionOptions = {
  /**
   * When true (default), calls `onListenStart` before opening the mic — use to stop assistant TTS when the user takes the floor.
   * Set false when restarting listen right after `speak()` so the new utterance is not cancelled immediately.
   */
  cancelAssistantVoice?: boolean;
};

/** Merge textarea prefix (when mic started) with live transcript. */
export function composeTranscriptPrefix(
  prefix: string,
  transcript: string,
): string {
  if (!transcript) return prefix;
  if (!prefix) return transcript;
  const needsSpace = !/\s$/.test(prefix) && !/^\s/.test(transcript);
  return needsSpace ? `${prefix} ${transcript}` : `${prefix}${transcript}`;
}

type UseSunnySpeechInputArgs = {
  input: string;
  setInput: (value: string) => void;
  /** Value from settings: `"auto"` uses `navigator.language`. */
  sttLangTag: string;
  disabled?: boolean;
  /** Called before `startListening` when interrupting assistant audio is desired (see `cancelAssistantVoice`). */
  onListenStart?: () => void;
  /** Fired after silence ends an utterance (`continuous: false`). Not fired after manual stop or finalize. */
  onNaturalUtterance?: (trimmedText: string) => void;
};

export function useSunnySpeechInput({
  input,
  setInput,
  sttLangTag,
  disabled = false,
  onListenStart,
  onNaturalUtterance,
}: UseSunnySpeechInputArgs) {
  /** Text in the field when the current dictation session started; drives merged display while active. */
  const [listeningPrefix, setListeningPrefix] = useState<string | null>(null);

  const manualUtteranceStopRef = useRef(false);
  const prevListeningRef = useRef(false);
  const onListenStartRef = useRef(onListenStart);
  const onNaturalUtteranceRef = useRef(onNaturalUtterance);

  useEffect(() => {
    onListenStartRef.current = onListenStart;
    onNaturalUtteranceRef.current = onNaturalUtterance;
  }, [onListenStart, onNaturalUtterance]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({ clearTranscriptOnListen: true });

  const displayValue =
    listeningPrefix !== null
      ? composeTranscriptPrefix(listeningPrefix, transcript)
      : input;

  const beginListeningSession = useCallback(
    async (
      prefixOverride?: string,
      options?: BeginListeningSessionOptions,
    ) => {
      const cancelAssistantVoice = options?.cancelAssistantVoice !== false;
      if (cancelAssistantVoice) {
        onListenStartRef.current?.();
      }
      const prefix = prefixOverride !== undefined ? prefixOverride : input;
      setListeningPrefix(prefix);
      resetTranscript();
      const lang = resolveRecognitionLang(sttLangTag);
      await SpeechRecognition.startListening({
        continuous: false,
        language: lang,
      });
    },
    [input, resetTranscript, sttLangTag],
  );

  useEffect(() => {
    const prev = prevListeningRef.current;
    prevListeningRef.current = listening;

    if (manualUtteranceStopRef.current) {
      manualUtteranceStopRef.current = false;
      return;
    }

    if (!prev || listening || listeningPrefix === null) return;

    const merged = composeTranscriptPrefix(listeningPrefix, transcript);
    resetTranscript();
    setListeningPrefix(null);
    setInput(merged);

    const trimmed = merged.trim();
    if (trimmed) {
      onNaturalUtteranceRef.current?.(trimmed);
    } else {
      queueMicrotask(() => {
        void beginListeningSession("", { cancelAssistantVoice: false });
      });
    }
  }, [
    listening,
    listeningPrefix,
    transcript,
    resetTranscript,
    setInput,
    beginListeningSession,
  ]);

  const finalizeListeningText = useCallback(async (): Promise<string> => {
    if (listeningPrefix === null) return input;
    manualUtteranceStopRef.current = true;
    const merged = composeTranscriptPrefix(listeningPrefix, transcript);
    await SpeechRecognition.stopListening();
    resetTranscript();
    setListeningPrefix(null);
    setInput(merged);
    return merged;
  }, [input, listeningPrefix, resetTranscript, setInput, transcript]);

  const toggleListening = useCallback(async () => {
    if (disabled && listeningPrefix === null) return;
    if (listeningPrefix !== null) {
      manualUtteranceStopRef.current = true;
      const merged = composeTranscriptPrefix(listeningPrefix, transcript);
      await SpeechRecognition.stopListening();
      resetTranscript();
      setListeningPrefix(null);
      setInput(merged);
      return;
    }
    await beginListeningSession();
  }, [
    disabled,
    listeningPrefix,
    transcript,
    resetTranscript,
    setInput,
    beginListeningSession,
  ]);

  const handleTextChange = useCallback(
    (value: string) => {
      if (listeningPrefix !== null) {
        manualUtteranceStopRef.current = true;
        void SpeechRecognition.abortListening();
        resetTranscript();
        setListeningPrefix(null);
      }
      setInput(value);
    },
    [listeningPrefix, resetTranscript, setInput],
  );

  return {
    displayValue,
    listening,
    listeningSessionActive: listeningPrefix !== null,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    toggleListening,
    finalizeListeningText,
    handleTextChange,
    beginListeningSession,
  };
}
