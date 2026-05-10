"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  IDLE_ANIMATION,
  animationSrc,
  type ReactionAnimationId,
} from "@/lib/character-animations";

const IDLE_SRC = animationSrc(IDLE_ANIMATION);

let playerModulePromise: Promise<void> | null = null;

function ensureDotLottiePlayer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("dotlottie-player")) return Promise.resolve();
  if (!playerModulePromise) {
    playerModulePromise = import("@dotlottie/player-component").then(() =>
      customElements.whenDefined("dotlottie-player").then(() => {
        /* element registered */
      }),
    );
  }
  return playerModulePromise;
}

type DotLottieElement = HTMLElement & {
  play: (targetAnimation?: string | number) => void;
  stop: () => void;
  getLottie?: () =>
    | {
        addEventListener: (
          type: string,
          listener: () => void,
          options?: AddEventListenerOptions,
        ) => void;
        removeEventListener?: (
          type: string,
          listener: () => void,
        ) => void;
      }
    | undefined;
};

type CharacterPanelProps = {
  /** Incrementa a cada resposta do assistente com animação válida. */
  reactionSeq: number;
  reactionAnimation: ReactionAnimationId | null;
  /** Tamanho visual do Lottie no dock (mantém proporção quadrada). */
  avatarSizePx?: number;
};

export function CharacterPanel({
  reactionSeq,
  reactionAnimation,
  avatarSizePx = 168,
}: CharacterPanelProps) {
  const [libReady, setLibReady] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [displaySrc, setDisplaySrc] = useState(IDLE_SRC);
  const [displayLoop, setDisplayLoop] = useState(true);
  const [phase, setPhase] = useState<"idle" | "reaction">("idle");

  const playerRef = useRef<DotLottieElement | null>(null);
  const lastSeqRef = useRef(0);
  const latestReactionSeq = useRef(reactionSeq);

  useLayoutEffect(() => {
    latestReactionSeq.current = reactionSeq;
  }, [reactionSeq]);

  const goIdle = useCallback(() => {
    setPhase("idle");
    setDisplaySrc(IDLE_SRC);
    setDisplayLoop(true);
    setPlayerKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void ensureDotLottiePlayer().then(() => {
      if (!cancelled) setLibReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reactionSeq === 0 || reactionAnimation == null) return;
    if (reactionSeq === lastSeqRef.current) return;
    lastSeqRef.current = reactionSeq;

    setPhase("reaction");
    setDisplaySrc(animationSrc(reactionAnimation));
    setDisplayLoop(false);
    setPlayerKey((k) => k + 1);
  }, [reactionSeq, reactionAnimation]);

  useLayoutEffect(() => {
    const el = playerRef.current;
    if (!el || !libReady) return;

    const kickPlay = () => {
      el.play();
    };

    el.addEventListener("ready", kickPlay);
    el.addEventListener("data_ready", kickPlay);

    return () => {
      el.removeEventListener("ready", kickPlay);
      el.removeEventListener("data_ready", kickPlay);
    };
  }, [libReady, playerKey]);

  useEffect(() => {
    if (!libReady || phase !== "reaction") return;

    const el = playerRef.current;
    if (!el) return;

    const seqSnapshot = reactionSeq;

    let cleaned = false;
    let completeArmed = false;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (cleaned) return;
      if (seqSnapshot !== latestReactionSeq.current) return;
      cleaned = true;
      if (safetyTimer != null) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      goIdle();
    };

    const tryArmLottie = () => {
      if (completeArmed) return true;
      const item = el.getLottie?.();
      if (!item) return false;
      completeArmed = true;
      item.addEventListener("complete", finish, { once: true });
      return true;
    };

    const arm = () => {
      if (cleaned) return;
      if (tryArmLottie()) return;
      requestAnimationFrame(() => {
        if (!cleaned) tryArmLottie();
      });
    };

    el.addEventListener("ready", arm);
    el.addEventListener("data_ready", arm);
    safetyTimer = setTimeout(finish, 5000);
    arm();

    return () => {
      cleaned = true;
      if (safetyTimer != null) clearTimeout(safetyTimer);
      el.removeEventListener("ready", arm);
      el.removeEventListener("data_ready", arm);
    };
  }, [libReady, phase, playerKey, goIdle, reactionSeq]);

  const side = `min(${avatarSizePx}px, min(36vw, 30vh, calc(100vw - 4rem)))`;

  return (
    <div
      className="pointer-events-none flex w-full shrink-0 justify-center px-1"
      role="img"
      aria-label="Personagem Sunny — animação Lottie"
    >
      <div className="flex w-full max-w-lg shrink-0 flex-col items-center overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/10">
        <div className="flex w-full justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-white/5 px-3 py-2">
          {libReady ? (
            <dotlottie-player
              key={playerKey}
              ref={playerRef}
              src={displaySrc}
              background="transparent"
              speed={1}
              loop={displayLoop ? "true" : "false"}
              autoplay={true}
              style={{
                width: side,
                height: side,
                maxWidth: "100%",
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center text-xs text-white/55"
              style={{
                width: side,
                height: side,
              }}
              aria-hidden
            >
              Carregando…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
