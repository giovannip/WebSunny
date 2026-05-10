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

/** Match installed voices to the LLM-declared BCP-47-like tag (already normalized). */
function pickVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  langTag: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const want = normalizeLangTag(langTag.trim());
  if (!want) return voices.find((v) => v.default) ?? voices[0] ?? null;
  const primary = want.split("-")[0] ?? want;

  const exact = voices.filter((v) => normalizeLangTag(v.lang) === want);
  const fromExact = pickFromCandidates(exact);
  if (fromExact) return fromExact;

  const extended = voices.filter((v) =>
    normalizeLangTag(v.lang).startsWith(`${want}-`),
  );
  const fromExtended = pickFromCandidates(extended);
  if (fromExtended) return fromExtended;

  const samePrimary = voices.filter((v) => {
    const nl = normalizeLangTag(v.lang);
    return nl === primary || nl.startsWith(`${primary}-`);
  });
  const fromPrimary = pickFromCandidates(samePrimary);
  if (fromPrimary) return fromPrimary;

  return voices.find((v) => v.default) ?? voices[0] ?? null;
}

export function normalizeUtteranceLangTag(langTag: string): string {
  return normalizeLangTag(langTag.trim()) || "pt-br";
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
    (text: string, langTag: string) => {
      const trimmed = text.trim();
      if (!trimmed || !enabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      const lang = normalizeUtteranceLangTag(langTag);
      const synth = window.speechSynthesis;
      const gen = ++speakGen.current;
      synth.cancel();

      whenVoicesReady(
        () => {
          if (!mounted.current || gen !== speakGen.current) return;
          const utter = new SpeechSynthesisUtterance(trimmed);
          utter.lang = lang;
          const voice = pickVoiceForLanguage(synth.getVoices(), lang);
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
