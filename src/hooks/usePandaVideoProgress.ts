//hooks/usePandaVideoProgress.ts 5/28/2026
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPlayerPreferences,
  saveContentProgress,
  savePlayerPreferences,
  PlayerPreferences,
} from "@/lib/course/videoProgress";



const PANDA_API_SRC = "https://player.pandavideo.com.br/api.v2.js";

function loadPandaApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();

    if (window.PandaPlayer) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PANDA_API_SRC}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Erro ao carregar API Panda")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PANDA_API_SRC;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Erro ao carregar API Panda"));

    document.head.appendChild(script);
  });
}

function getEventVolume(event: any): number | undefined {
  const possible =
    event?.volume ??
    event?.currentVolume ??
    event?.data?.volume ??
    event?.player?.volume;

  if (typeof possible !== "number") return undefined;

  if (possible > 1) return Math.max(0, Math.min(1, possible / 100));

  return Math.max(0, Math.min(1, possible));
}

function getEventMuted(event: any): boolean | undefined {
  const possible =
    event?.muted ??
    event?.isMuted ??
    event?.isMutedIndicator ??
    event?.data?.muted;

  return typeof possible === "boolean" ? possible : undefined;
}

type UsePandaVideoProgressParams = {
  iframeId: string;
  contentId: number;
  token?: string;
  initialSeconds?: number;
  initialDuration?: number;
  initiallyCompleted?: boolean;
  enabled?: boolean;
  onCompleted?: () => void;
  onProgressSaved?: (progress: any) => void;
};

export function usePandaVideoProgress({
  iframeId,
  contentId,
  token,
  initialSeconds = 0,
  initialDuration = 0,
  initiallyCompleted = false,
  enabled = true,
  onCompleted,
  onProgressSaved,
}: UsePandaVideoProgressParams) {
  const playerRef = useRef<any>(null);

  const lastTimeRef = useRef<number>(initialSeconds);
  const durationRef = useRef<number>(initialDuration);
  const lastHeartbeatAtRef = useRef<number>(0);
  const lastPreferenceSaveAtRef = useRef<number>(0);
  const lastPersistedSecondRef = useRef<number>(initialSeconds);
  const hasNotifiedCompletedRef = useRef<boolean>(initiallyCompleted);
  const prefsRef = useRef<PlayerPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const persistProgress = useCallback(
    async (
      event: "timeupdate" | "pause" | "ended" | "beforeunload" | "manual",
      force = false,
    ) => {
      if (!token || !contentId) return;

      const now = Date.now();

      if (!force && now - lastHeartbeatAtRef.current < 20_000) {
        return;
      }

      const current = Math.max(0, Math.floor(lastTimeRef.current || 0));

      const duration = Math.max(
        0,
        Math.floor(durationRef.current || initialDuration || 0),
      );

      if (event === "timeupdate") {
        const diff = Math.abs(current - lastPersistedSecondRef.current);

        if (current <= 0 || diff < 15) {
          return;
        }
      }

      if (event !== "ended" && current <= 0 && duration <= 0) {
        return;
      }

      lastHeartbeatAtRef.current = now;
      lastPersistedSecondRef.current = current;

      try {
        setIsSaving(true);

        const response = await saveContentProgress(contentId, token, {
          current_time: current,
          duration,
          event,
          volume: prefsRef.current?.volume,
          muted: prefsRef.current?.muted,
          playback_rate: prefsRef.current?.playback_rate,
        });

        const progress = response?.progress;

        onProgressSaved?.(progress);

        const becameCompletedNow =
          Boolean(progress?.is_completed) && !hasNotifiedCompletedRef.current;

        if (becameCompletedNow) {
          hasNotifiedCompletedRef.current = true;
          onCompleted?.();
        }
      } catch (error) {
        console.error("Erro ao salvar progresso do vídeo:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [token, contentId, initialDuration, onCompleted, onProgressSaved],
  );

  const persistPreferences = useCallback(
    async (patch: Partial<PlayerPreferences>) => {
      if (!token) return;

      const now = Date.now();

      if (now - lastPreferenceSaveAtRef.current < 3_000) {
        return;
      }

      lastPreferenceSaveAtRef.current = now;

      prefsRef.current = {
        volume: patch.volume ?? prefsRef.current?.volume ?? 1,
        muted: patch.muted ?? prefsRef.current?.muted ?? false,
        playback_rate:
          patch.playback_rate ?? prefsRef.current?.playback_rate ?? 1,
      };

      try {
        await savePlayerPreferences(token, prefsRef.current);
      } catch (error) {
        console.error("Erro ao salvar preferências do player:", error);
      }
    },
    [token],
  );

  useEffect(() => {
    lastTimeRef.current = initialSeconds;
    durationRef.current = initialDuration;
    lastPersistedSecondRef.current = initialSeconds;
    hasNotifiedCompletedRef.current = initiallyCompleted;
  }, [contentId, initialSeconds, initialDuration, initiallyCompleted]);

  useEffect(() => {
    if (!enabled || !token || !iframeId || !contentId) return;
    const safeToken = token;
    let disposed = false;

    async function boot() {
      try {
        await loadPandaApi();

        if (disposed) return;

        const preferences = await getPlayerPreferences(safeToken);
        prefsRef.current = preferences;

        window.pandascripttag = window.pandascripttag || [];

        window.pandascripttag.push(() => {
          if (disposed) return;

          const player = new PandaPlayer(iframeId, {
            onReady: () => {
              playerRef.current = player;

              try {
                if (typeof player.setVolume === "function") {
                  player.setVolume(preferences.volume);
                }

                if (preferences.muted && typeof player.mute === "function") {
                  player.mute();
                }

                if (!preferences.muted && typeof player.unmute === "function") {
                  player.unmute();
                }

                if (
                  typeof player.setPlaybackRate === "function" &&
                  preferences.playback_rate
                ) {
                  player.setPlaybackRate(preferences.playback_rate);
                }

                const shouldResume =
                  !initiallyCompleted &&
                  initialSeconds > 10 &&
                  (!initialDuration || initialSeconds < initialDuration - 15);

                if (shouldResume && typeof player.seek === "function") {
                  player.seek(initialSeconds);
                }

                if (shouldResume && typeof player.seekTo === "function") {
                  player.seekTo(initialSeconds);
                }
              } catch (error) {
                console.warn(
                  "Nem todos os métodos do PandaPlayer estão disponíveis:",
                  error,
                );
              }
              player.onEvent((event: any) => {
                // remover ====================================================================================================
                // console.log("🐼 Evento bruto Panda:", event);

                const message = event?.message;

                /**
                 * Evento completo do Panda.
                 * Este é o evento mais rico: traz duração, tempo atual, volume, mute e velocidade.
                 */
                if (message === "panda_allData") {
                  const playerData = event?.playerData ?? {};

                  const current = Number(
                    playerData?.currentTime ??
                      event?.currentTime ??
                      event?.data?.currentTime ??
                      0,
                  );

                  const duration = Number(
                    playerData?.duration ??
                      event?.duration ??
                      event?.data?.duration ??
                      durationRef.current ??
                      initialDuration ??
                      0,
                  );

                  const volume = Number(
                    playerData?.volume ??
                      event?.volume ??
                      prefsRef.current?.volume ??
                      1,
                  );

                  const muted = Boolean(
                    playerData?.muted ??
                    event?.muted ??
                    prefsRef.current?.muted ??
                    false,
                  );

                  const playbackRate = Number(
                    playerData?.speed?.selected ??
                      playerData?.playbackRate ??
                      event?.playbackRate ??
                      prefsRef.current?.playback_rate ??
                      1,
                  );
                  // REMOVER
                  // console.log("📦 Panda allData interpretado:", {
                  //   current,
                  //   duration,
                  //   volume,
                  //   muted,
                  //   playbackRate,
                  // });

                  if (Number.isFinite(current) && current > 0) {
                    lastTimeRef.current = current;
                  }

                  if (Number.isFinite(duration) && duration > 0) {
                    durationRef.current = duration;
                  }

                  prefsRef.current = {
                    volume: Number.isFinite(volume) ? volume : 1,
                    muted,
                    playback_rate: Number.isFinite(playbackRate)
                      ? playbackRate
                      : 1,
                  };

                  void persistProgress("timeupdate");

                  return;
                }

                /**
                 * Evento de progresso do Panda.
                 * Normalmente traz currentTime, mas não traz duration.
                 * Por isso usamos durationRef, que foi preenchido pelo panda_allData.
                 */
                if (
                  message === "panda_progress" ||
                  message === "panda_timeupdate" ||
                  message === "timeupdate"
                ) {
                  const current = Number(
                    event?.currentTime ??
                      event?.current_time ??
                      event?.time ??
                      event?.data?.currentTime ??
                      event?.data?.current_time ??
                      0,
                  );

                  const duration = Number(
                    event?.duration ??
                      event?.videoDuration ??
                      event?.data?.duration ??
                      event?.data?.videoDuration ??
                      durationRef.current ??
                      initialDuration ??
                      0,
                  );

                  // console.log("⏱️ Panda progresso interpretado:", {
                  //   current,
                  //   duration,
                  //   durationRef: durationRef.current,
                  //   raw: event,
                  // });

                  if (Number.isFinite(current) && current > 0) {
                    lastTimeRef.current = current;
                  }

                  if (Number.isFinite(duration) && duration > 0) {
                    durationRef.current = duration;
                  }

                  void persistProgress("timeupdate");

                  return;
                }

                /**
                 * Pause: salva imediatamente.
                 */
                if (
                  message === "panda_pause" ||
                  message === "pause" ||
                  message === "panda_paused"
                ) {
                  void persistProgress("pause", true);
                  return;
                }

                /**
                 * Fim do vídeo: salva e marca conclusão.
                 */
                if (
                  message === "panda_ended" ||
                  message === "ended" ||
                  message === "panda_finish"
                ) {
                  void persistProgress("ended", true);
                  return;
                }

                /**
                 * Volume/mute.
                 */
                if (
                  message === "panda_volumechange" ||
                  message === "volumechange" ||
                  message === "panda_volume_update"
                ) {
                  const volume = getEventVolume(event);
                  const muted = getEventMuted(event);

                  void persistPreferences({
                    volume,
                    muted,
                  });

                  return;
                }

                /**
                 * Captura defensiva de volume/mute mesmo quando o evento vem com outro nome.
                 */
                const volume = getEventVolume(event);
                const muted = getEventMuted(event);

                if (volume !== undefined || muted !== undefined) {
                  void persistPreferences({
                    volume,
                    muted,
                  });
                }
              });
            },
          });
        });
      } catch (error) {
        console.error("Erro ao inicializar PandaPlayer:", error);
      }
    }

    void boot();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void persistProgress("beforeunload", true);
      }
    };

    const onBeforeUnload = () => {
      void persistProgress("beforeunload", true);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);

      void persistProgress("beforeunload", true);
    };
  }, [
    enabled,
    token,
    iframeId,
    contentId,
    initialSeconds,
    initialDuration,
    initiallyCompleted,
    persistProgress,
    persistPreferences,
  ]);

  return {
    isSaving,
    saveNow: () => persistProgress("manual", true),
  };
}
