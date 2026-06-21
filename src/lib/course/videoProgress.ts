// lib/course/videoProgress.ts
import { api } from "@/lib/axios";

export type PlayerPreferences = {
  volume: number;
  muted: boolean;
  playback_rate: number;
};

export type SaveProgressPayload = {
  current_time: number;
  duration?: number;
  event?: "timeupdate" | "pause" | "ended" | "beforeunload" | "manual";
  volume?: number;
  muted?: boolean;
  playback_rate?: number;
};

export async function saveContentProgress(
  contentId: number,
  token: string,
  payload: SaveProgressPayload
) {
  const response = await api.patch(`/contents/${contentId}/progress`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getPlayerPreferences(token: string): Promise<PlayerPreferences> {
  const response = await api.get("/player/preferences", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function savePlayerPreferences(
  token: string,
  payload: Partial<PlayerPreferences>
) {
  const response = await api.patch("/player/preferences", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getContinueWatching(token: string) {
  const response = await api.get("/continue-watching", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}