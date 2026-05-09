"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Substrings in `name` / `voiceURI` — Web Speech API has no gender field. */
const FEMININE_VOICE_HINTS = [
  "maria",
  "francisca",
  "helena",
  "lúcia",
  "lucia",
  "fernanda",
  "camila",
  "inês",
  "ines",
  "laura",
  "vitória",
  "vitoria",
  "bianca",
  "clarice",
  "letícia",
  "leticia",
  "amanda",
  "beatriz",
  "joana",
  "yara",
  "laís",
  "lais",
  "female",
  "mulher",
  "neural2-f",
  "wavenet-f",
  "standard-f",
  "legacy-f",
] as const;

const MASCULINE_VOICE_HINTS = [
  "antônio",
  "antonio",
  "daniel",
  "joaquim",
  "miguel",
  "carlos",
  "ricardo",
  "paulo",
  "pedro",
  "bruno",
  "male",
  "masculino",
  "neural2-m",
  "wavenet-m",
  "standard-m",
  "legacy-m",
  "márcio",
  "marcio",
  "thiago",
  "felipe",
] as const;

function normalizeLangTag(lang: string): string {
  return lang.toLowerCase().replace(/_/g, "-");
}

function voiceHaystack(v: SpeechSynthesisVoice): string {
  return `${v.name} ${v.voiceURI}`.toLowerCase();
}

function matchesHints(haystack: string, hints: readonly string[]): boolean {
  return hints.some((h) => haystack.includes(h));
}

function isPtBrLang(lang: string): boolean {
  return normalizeLangTag(lang).startsWith("pt-br");
}

function isPortugueseLang(lang: string): boolean {
  const n = normalizeLangTag(lang);
  return n === "pt" || n.startsWith("pt-");
}

/** Prefer feminine-sounding local voices; avoid clearly male ones when possible. */
function pickFromCandidates(
  candidates: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (candidates.length === 0) return null;
  const feminine = candidates.find((v) =>
    matchesHints(voiceHaystack(v), FEMININE_VOICE_HINTS),
  );
  if (feminine) return feminine;
  const notMasculine = candidates.find(
    (v) => !matchesHints(voiceHaystack(v), MASCULINE_VOICE_HINTS),
  );
  if (notMasculine) return notMasculine;
  return candidates[0];
}

function pickPortugueseVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const ptBr = voices.filter((v) => isPtBrLang(v.lang));
  const fromBr = pickFromCandidates(ptBr);
  if (fromBr) return fromBr;

  const ptNonBr = voices.filter(
    (v) => isPortugueseLang(v.lang) && !isPtBrLang(v.lang),
  );
  const fromPt = pickFromCandidates(ptNonBr);
  if (fromPt) return fromPt;

  const anyPt = voices.filter((v) => isPortugueseLang(v.lang));
  return pickFromCandidates(anyPt) ?? voices[0] ?? null;
}

function whenVoicesReady(
  run: () => void,
  isStale: () => boolean,
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const tryRun = () => {
    if (isStale()) return true;
    if (synth.getVoices().length > 0) {
      if (!isStale()) run();
      return true;
    }
    return false;
  };
  if (tryRun()) return;
  const onVoices = () => {
    if (tryRun()) {
      synth.removeEventListener("voiceschanged", onVoices);
    }
  };
  synth.addEventListener("voiceschanged", onVoices);
}

let speechSupportVersion = 0;
const speechSupportListeners = new Set<() => void>();

function subscribeSpeechSupport(onChange: () => void): () => void {
  speechSupportListeners.add(onChange);
  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      speechSupportVersion += 1;
      for (const l of speechSupportListeners) l();
    });
  }
  return () => {
    speechSupportListeners.delete(onChange);
  };
}

function getSpeechSupportSnapshot(): boolean {
  if (typeof window === "undefined" || speechSupportVersion === 0) return false;
  return "speechSynthesis" in window;
}

function getSpeechSupportServerSnapshot(): boolean {
  return false;
}

export function useSunnyVoice() {
  const supported = useSyncExternalStore(
    subscribeSpeechSupport,
    getSpeechSupportSnapshot,
    getSpeechSupportServerSnapshot,
  );
  const [enabled, setEnabled] = useState(true);
  const mounted = useRef(true);
  const speakGen = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    speakGen.current += 1;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !enabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      const synth = window.speechSynthesis;
      const gen = ++speakGen.current;
      synth.cancel();

      whenVoicesReady(
        () => {
          if (!mounted.current || gen !== speakGen.current) return;
          const utter = new SpeechSynthesisUtterance(trimmed);
          utter.lang = "pt-BR";
          const voice = pickPortugueseVoice(synth.getVoices());
          if (voice) utter.voice = voice;
          utter.rate = 1.02;
          utter.pitch = 1.06;
          synth.speak(utter);
        },
        () => gen !== speakGen.current || !mounted.current,
      );
    },
    [enabled],
  );

  return { supported, enabled, setEnabled, speak, cancel };
}
