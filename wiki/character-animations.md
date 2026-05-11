# Character animations

**Summary**: Sunny’s avatar uses DotLottie; idle loops `Smiling Dog` while each assistant reply plays one of four reaction `.json` files under `public/lottie/`, keyed by exact display strings shared with the LLM and Zod.

**Sources**: `raw/repository-overview-2026-05-11.md`

**Last updated**: 2026-05-11

---

- **Idle**: `Smiling Dog` maps to `public/lottie/smiling-dog.json` and loops until a reaction plays (source: repository-overview-2026-05-11.md).
- **Reactions** (non-looping, then return to idle): `Astronaut Dog`, `Flirting Dog`, `Happy Dog`, `Happy Unicorn Dog` — filenames are kebab-case equivalents under `public/lottie/` (source: repository-overview-2026-05-11.md).
- **Validation**: `reactionAnimationSchema` in `lib/character-animations.ts` mirrors the allowed reaction set; the chat route rejects model output outside that set (source: repository-overview-2026-05-11.md).
- **UI**: `CharacterPanel` lazy-loads `@dotlottie/player-component`, swaps `src` on each new `reactionSeq`, listens for Lottie `complete` (with a safety timeout) to return to idle (source: repository-overview-2026-05-11.md).

## Related pages

- [[sunny-persona-and-prompt]]
- [[architecture-and-api]]
- [[repository-structure]]
