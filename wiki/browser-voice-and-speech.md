# Browser voice and speech

**Summary**: Assistant replies can be spoken with the Web Speech API (`useSunnyVoice`), using `replyLanguage` to pick a voice; input uses `react-speech-recognition` with configurable STT language, optional “conversation mode,” and user-facing strings mostly in Portuguese.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

## Text-to-speech

- `useSunnyVoice` exposes `supported`, `enabled`, `speak`, and `cancel`, using `speechSynthesis` when available (source: repository-overview-2026-05-11.md).
- Voice selection normalizes BCP-47 tags, prefers **feminine-sounding** names/URIs when heuristics match, and avoids clearly masculine hints when possible (source: repository-overview-2026-05-11.md).
- After each successful chat response, `ChatAssistant` calls `speak(reply, replyLanguage)` so TTS language tracks the model-declared language of the reply (source: repository-overview-2026-05-11.md).

## Speech-to-text

- `useSunnySpeechInput` wraps `react-speech-recognition`, merges live transcript with textarea text, and supports `onNaturalUtterance` for auto-send on end-of-utterance when using mic mode (source: repository-overview-2026-05-11.md).
- STT language options include `auto` (browser default) and several fixed locales; choice is persisted under the `websunny-stt-lang` localStorage key (source: repository-overview-2026-05-11.md).

## UX notes

- UI labels for voice/STT and some errors are **Portuguese** in `ChatAssistant` / `ChatThread` (source: repository-overview-2026-05-11.md).

## Related pages

- [[architecture-and-api]]
- [[tech-stack]]
- [[configuration-and-env]]
