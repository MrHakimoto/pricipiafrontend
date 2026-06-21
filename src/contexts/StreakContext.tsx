"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import useSWR, { type KeyedMutator } from "swr";
import {
  checkinStatus,
  checkinDaily,
  type CheckinStatusResponse,
} from "@/lib/dailyCheck/daily";

interface StreakContextType {
  streakData: CheckinStatusResponse | undefined;
  isLoading: boolean;
  error: unknown;
  mutate: KeyedMutator<CheckinStatusResponse>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

const CHECKIN_COOKIE_NAME = "daily_checkin";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.split("=")[1] ?? "");
}

function setCheckinCookie(date: string): void {
  if (typeof document === "undefined") return;

  /*
   * Não precisa tentar calcular meia-noite local aqui.
   * O cookie é apenas um freio client-side contra chamadas repetidas.
   * A verdade permanece no backend.
   */
  const maxAge = 60 * 60 * 24;

  document.cookie = `${CHECKIN_COOKIE_NAME}=${encodeURIComponent(
    date,
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function StreakProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const token = session?.laravelToken;

  const isCheckingInRef = useRef(false);

  const {
    data: streakData,
    error,
    isLoading,
    mutate,
  } = useSWR<CheckinStatusResponse>(
    token ? ["checkin-status", token] : null,
    () => checkinStatus(token as string),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 300000,
      dedupingInterval: 15000,
      shouldRetryOnError: false,
    },
  );

  useEffect(() => {
    async function autoCheckin() {
      if (!token) return;
      if (!streakData) return;
      if (isCheckingInRef.current) return;

      const backendToday = streakData.today;

      if (!backendToday) return;

      const lastCheckinCookie = getCookie(CHECKIN_COOKIE_NAME);

      if (streakData.has_checked_in_today) {
        if (lastCheckinCookie !== backendToday) {
          setCheckinCookie(backendToday);
        }

        return;
      }

      if (lastCheckinCookie === backendToday) {
        /*
         * O cookie diz que houve tentativa hoje, mas o backend ainda diz que não.
         * Nesse caso, revalida em vez de bater POST novamente.
         */
        await mutate();
        return;
      }

      try {
        isCheckingInRef.current = true;

        const result = await checkinDaily(token);

        if (result.status) {
          await mutate(result.status, false);
        } else {
          await mutate();
        }

        setCheckinCookie(backendToday);
      } catch (err) {
        console.error("Falha no check-in automático:", err);
        await mutate();
      } finally {
        isCheckingInRef.current = false;
      }
    }

    if (status === "authenticated" && streakData && !isLoading) {
      autoCheckin();
    }
  }, [status, token, streakData, isLoading, mutate]);

  return (
    <StreakContext.Provider value={{ streakData, isLoading, error, mutate }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);

  if (context === undefined) {
    throw new Error("useStreak must be used within a StreakProvider");
  }

  return context;
}