// components/home/ContinueWatchingCard.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Play, Clock, PlayCircle } from "lucide-react";
import { getContinueWatching } from "@/lib/course/videoProgress";

type ContinueWatchingData = {
  content_id: number;
  content_title: string;
  module_id: number;
  module_name: string;
  course_name?: string | null;
  last_watched_seconds: number;
  duration_seconds: number;
  progress_percent: number;
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${rest
    .toString()
    .padStart(2, "0")}`;
}

export default function ContinueWatchingCard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [item, setItem] = useState<ContinueWatchingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContinueWatching() {
      if (status !== "authenticated" || !session?.laravelToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getContinueWatching(session.laravelToken);
        setItem(response?.data ?? null);
      } catch (error) {
        console.error("Erro ao buscar continuar assistindo:", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    if (status !== "loading") {
      loadContinueWatching();
    }
  }, [status, session?.laravelToken]);

  if (loading || !item) {
    return null;
  }

  const moduleSlug = slugify(item.module_name);
  const contentSlug = slugify(item.content_title);
  const progress = Math.min(100, Math.max(0, item.progress_percent || 0));

  const url = `/modulos/${item.module_id}/${moduleSlug}/${item.content_id}/${contentSlug}`;

return (
  <button
    type="button"
    onClick={() => router.push(url)}
    className="group w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-left shadow-sm transition hover:border-[#0E00D0]/40 hover:shadow-md dark:border-white/10 dark:bg-[#020817]"
  >
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0E00D0] text-white transition group-hover:scale-105">
        <PlayCircle size={25} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#0E00D0]">
            Continuar assistindo
          </p>

          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {formatTime(item.last_watched_seconds)}
          </span>
        </div>

        <h3 className="mt-1 line-clamp-1 text-base font-bold text-gray-950 dark:text-white">
          {item.content_title}
        </h3>

        <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
          {item.course_name ? `${item.course_name} • ` : ""}
          {item.module_name}
        </p>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Progresso</span>
            <span>{Math.round(item.progress_percent || 0)}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-[#0E00D0] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, item.progress_percent || 0)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </button>
);
}