"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import StreakMonthCalendar from "./StreakMonthCalendar";
import { checkinStatus, CheckinStatusResponse } from "@/lib/dailyCheck/daily";

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function shiftMonth(month: string, diff: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + diff, 1, 12);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function CalendarSkeleton() {
  return (
    <div className="rounded-3xl bg-gray-50 p-4 dark:bg-white/[0.04]">
      <div className="animate-pulse">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-10 w-44 rounded-2xl bg-gray-200 dark:bg-white/10" />
          <div className="h-10 w-24 rounded-2xl bg-gray-200 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-xl bg-gray-200 dark:bg-white/10"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StreakMonthCalendarContainer() {
  const { data: session, status } = useSession();
  const token = session?.laravelToken;

  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<CheckinStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonth = useMemo(() => getCurrentMonth(), []);

  useEffect(() => {
    async function load() {
      if (status === "loading") return;

      if (status !== "authenticated" || !token) {
        setLoading(false);
        setData(null);
        return;
      }

      try {
        setLoading(true);
        const response = await checkinStatus(token, { month });
        setData(response);
      } catch (error) {
        console.error("Erro ao carregar calendário de ofensiva:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, token, month]);

  if (loading) {
    return <CalendarSkeleton />;
  }

  if (!data) {
    return (
      <div className="rounded-3xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
        Calendário indisponível no momento.
      </div>
    );
  }

  return (
    <StreakMonthCalendar
      checkins={data.month_checkins ?? []}
      monthLabel={data.month_label ?? month}
      today={`${month}-01`}
      currentStreak={data.current_streak}
      longestStreak={data.longest_streak}
      onPreviousMonth={() => setMonth((current) => shiftMonth(current, -1))}
      onNextMonth={() => setMonth((current) => shiftMonth(current, 1))}
      disableNext={month >= currentMonth}
    />
  );
}