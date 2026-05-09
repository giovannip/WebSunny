import { z } from "zod";

/** Display names — must match LLM output and public filenames (kebab in URL). */
export const IDLE_ANIMATION = "Smiling Dog" as const;

export const REACTION_ANIMATIONS = [
  "Astronaut Dog",
  "Flirting Dog",
  "Happy Dog",
  "Happy Unicorn Dog",
] as const;

export type ReactionAnimationId = (typeof REACTION_ANIMATIONS)[number];

export type CharacterAnimationId =
  | typeof IDLE_ANIMATION
  | ReactionAnimationId;

const filenameById: Record<CharacterAnimationId, string> = {
  "Smiling Dog": "smiling-dog.json",
  "Astronaut Dog": "astronaut-dog.json",
  "Flirting Dog": "flirting-dog.json",
  "Happy Dog": "happy-dog.json",
  "Happy Unicorn Dog": "happy-unicorn-dog.json",
};

export function animationSrc(id: CharacterAnimationId): string {
  return `/lottie/${filenameById[id]}`;
}

export const reactionAnimationSchema = z.enum(REACTION_ANIMATIONS);

export const REACTION_ANIMATIONS_LIST_PT =
  REACTION_ANIMATIONS.map((a) => `“${a}”`).join(", ");
