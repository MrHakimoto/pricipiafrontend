// components/home/metricas/WeekProgress.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Check, X, Flame, Calendar, RefreshCw } from "lucide-react";
import { checkinStatus, checkinDaily } from "@/lib/dailyCheck/daily";
import { getUTCDateString } from "@/utils/dateHelpers";

interface UserStreak {
  id?: number;
  user_id?: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  has_checked_in_today: boolean;
  week_checkins?: string[];
}

type DayStatus = "done" | "current" | "missed" | "pending";

interface WeekDay {
  name: string;
  status: DayStatus;
}

const STREAK_KEY = "/api/checkin-status";

function WeekProgressSkeleton() {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
      <div className="animate-pulse">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-28 rounded-xl bg-gray-200 dark:bg-white/10" />
          <div className="h-4 w-16 rounded-xl bg-gray-200 dark:bg-white/10" />
        </div>

        <div className="mx-auto mb-6 h-16 w-28 rounded-2xl bg-gray-200 dark:bg-white/10" />

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/10" />
              <div className="h-3 w-6 rounded bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getStreakText(streak: number): string {
  return streak === 1 ? "dia" : "dias";
}

export default function WeekProgress() {
  const { data: session } = useSession();
  const token = session?.laravelToken;

  const [animatedStreak, setAnimatedStreak] = useState(0);

  const {
    data: streakData,
    error,
    isLoading,
    mutate,
  } = useSWR<UserStreak, Error, readonly [string, string] | null>(
    token ? ([STREAK_KEY, token] as const) : null,
    ([, currentToken]) => checkinStatus(currentToken),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 300000,
    },
  );

  useEffect(() => {
    const autoCheckin = async () => {
      if (!token || !streakData || isLoading) return;

      const today = getUTCDateString();
      const lastCheckin = localStorage.getItem("daily_checkin_date");

      if (lastCheckin === today && streakData.has_checked_in_today) {
        return;
      }

      try {
        if (!streakData.has_checked_in_today) {
          await checkinDaily(token);
          await mutate();
        }

        localStorage.setItem("daily_checkin_date", today);
      } catch (err) {
        console.error("Falha no check-in automático:", err);
      }
    };

    autoCheckin();
  }, [token, streakData, isLoading, mutate]);

  useEffect(() => {
    if (!streakData || isLoading) return;

    const target = streakData.current_streak;
    const duration = 900;
    const startTime = performance.now();

    const animateNumber = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      setAnimatedStreak(current);

      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setAnimatedStreak(target);
      }
    };

    requestAnimationFrame(animateNumber);
  }, [streakData, isLoading]);

  const days = useMemo<WeekDay[]>(() => {
    const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const today = new Date();
    const todayIndex = today.getDay();

    const weekDates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - todayIndex + i);
      weekDates.push(date.toISOString().split("T")[0]);
    }

    const weekCheckins = streakData?.week_checkins || [];

    return labels.map((name, index) => {
      const dateStr = weekDates[index];
      const isToday = index === todayIndex;
      const hasCheckedIn = weekCheckins.includes(dateStr);

      if (isToday) {
        return {
          name,
          status: streakData?.has_checked_in_today ? "done" : "current",
        };
      }

      if (index < todayIndex) {
        return {
          name,
          status: hasCheckedIn ? "done" : "missed",
        };
      }

      return { name, status: "pending" };
    });
  }, [streakData]);

  if (isLoading) {
    return <WeekProgressSkeleton />;
  }

  if (error || !streakData) {
    return (
      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <Calendar className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-950 dark:text-white">
              Ofensiva
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Não foi possível carregar seu check-in.
            </p>

            <button
              onClick={() => mutate()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#020B1F] sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <Flame className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-bold text-gray-950 dark:text-white">
              Ofensiva
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Check-in diário
            </p>
          </div>
        </div>

        <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
          Hoje
        </div>
      </div>

      <div className="mb-7 text-center">
        <div className="flex items-end justify-center gap-2">
          <span className="text-5xl font-black tracking-tight text-gray-950 dark:text-white">
            {animatedStreak}
          </span>
          <span className="pb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {getStreakText(animatedStreak)}
          </span>
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          sequência atual
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full transition",
                day.status === "done"
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                  : "",
                day.status === "current"
                  ? "bg-[#0E00D0] text-white shadow-sm shadow-[#0E00D0]/30"
                  : "",
                day.status === "missed"
                  ? "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  : "",
                day.status === "pending"
                  ? "border border-gray-200 bg-gray-50 text-gray-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-600"
                  : "",
              ].join(" ")}
            >
              {day.status === "done" && <Check className="h-4 w-4" />}
              {day.status === "current" && (
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              )}
              {day.status === "missed" && <X className="h-4 w-4" />}
            </div>

            <span
              className={[
                "text-[11px] font-medium",
                day.status === "pending"
                  ? "text-gray-400 dark:text-gray-600"
                  : "text-gray-600 dark:text-gray-300",
              ].join(" ")}
            >
              {day.name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm dark:bg-white/[0.04]">
        <span className="text-gray-500 dark:text-gray-400">
          Melhor sequência
        </span>

        <span className="font-bold text-orange-500">
          {streakData.longest_streak} {getStreakText(streakData.longest_streak)}
        </span>
      </div>
    </section>
  );
}
