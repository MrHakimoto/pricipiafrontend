"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

type CalendarCell = {
  day: number;
  dateString: string;
  isToday: boolean;
  isFuture: boolean;
  checked: boolean;
} | null;

type Props = {
  monthLabel: string;
  checkins: string[];
  today?: string;
  currentStreak?: number;
  longestStreak?: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  disableNext?: boolean;
};

const WEEK_DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseMonth(monthLabel?: string, today?: string) {
  if (today) {
    const [year, month] = today.split("-").map(Number);
    return new Date(year, month - 1, 1, 12);
  }

  return new Date();
}

export function buildMonthCells(
  month: string,
  checkins: string[],
  today?: string
): CalendarCell[] {
  const [year, monthNumber] = month.split("-").map(Number);

  const first = new Date(year, monthNumber - 1, 1, 12);
  const last = new Date(year, monthNumber, 0, 12);

  const firstWeekDay = first.getDay();
  const daysInMonth = last.getDate();

  const todayString = today ?? getLocalDateString(new Date());
  const checkinSet = new Set(checkins);

  const blanks = Array.from({ length: firstWeekDay }).map(() => null);

  const days = Array.from({ length: daysInMonth }).map((_, index) => {
    const date = new Date(year, monthNumber - 1, index + 1, 12);
    const dateString = getLocalDateString(date);

    return {
      day: index + 1,
      dateString,
      isToday: dateString === todayString,
      isFuture: dateString > todayString,
      checked: checkinSet.has(dateString),
    };
  });

  return [...blanks, ...days];
}

export default function StreakMonthCalendar({
  monthLabel,
  checkins,
  today,
  currentStreak = 0,
  longestStreak = 0,
  onPreviousMonth,
  onNextMonth,
  disableNext = false,
}: Props) {
  const month = today?.slice(0, 7) ?? getLocalDateString(new Date()).slice(0, 7);
  const cells = buildMonthCells(month, checkins, today);
  const studiedDays = checkins.length;

  return (
    <div className="rounded-3xl bg-gray-50 p-4 dark:bg-white/[0.04]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-950 dark:text-white">
            Calendário de ofensiva
          </h3>
          <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
            {monthLabel}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div className="mr-2 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs dark:bg-[#020B1F] sm:flex">
            <span className="text-gray-500 dark:text-gray-400">Atual</span>
            <span className="font-black text-orange-500">{currentStreak}</span>
            <span className="text-gray-500 dark:text-gray-400">Recorde</span>
            <span className="font-black text-[#0E00D0]">{longestStreak}</span>
          </div>

          <button
            type="button"
            onClick={onPreviousMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-[#020B1F] dark:text-gray-200 dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            disabled={disableNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#020B1F] dark:text-gray-200 dark:hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          return (
            <div
              key={cell.dateString}
              title={cell.dateString}
              className={[
                "group relative flex aspect-square min-h-8 items-center justify-center rounded-xl border text-xs font-bold transition sm:min-h-9",
                cell.checked
                  ? "border-orange-500/40 bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                  : "border-black/5 bg-white text-gray-400 dark:border-white/10 dark:bg-[#020B1F] dark:text-gray-600",
                cell.isToday && !cell.checked
                  ? "ring-2 ring-[#0E00D0]/50"
                  : "",
                cell.isToday && cell.checked ? "ring-2 ring-orange-300" : "",
                cell.isFuture ? "opacity-35" : "",
              ].join(" ")}
            >
              {cell.checked ? <Flame className="h-3.5 w-3.5" /> : cell.day}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-orange-500" />
          <span>{studiedDays} dias estudados</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-[#0E00D0]" />
          <span>Hoje</span>
        </div>
      </div>
    </div>
  );
}