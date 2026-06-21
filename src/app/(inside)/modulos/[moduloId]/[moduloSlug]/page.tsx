// modulos/[moduloId]/[moduloSlug]/page.tsx
"use client";

import { Skeleton } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useModuloStore } from "@/store/useModuloStore";

export default function ModuloRedirectPage() {
  const router = useRouter();
  const params = useParams();

  const { moduloId, moduloSlug } = params as {
    moduloId: string;
    moduloSlug: string;
  };

  const contents = useModuloStore((state) => state.contents);
  const initialLoading = useModuloStore((state) => state.initialLoading);
  const loadedModuloId = useModuloStore((state) => state.loadedModuloId);

  const [hasRedirected, setHasRedirected] = useState(false);

  function toSlug(str: string) {
    if (!str) return "";

    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function isCompletedValue(value: unknown): boolean {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true"
    );
  }

  function isLessonCompleted(lesson: any): boolean {
    if (lesson?.content_type && lesson.content_type !== "aula") {
      return false;
    }

    return isCompletedValue(lesson?.user_progress?.is_completed);
  }

  useEffect(() => {
    if (initialLoading) return;

    if (String(loadedModuloId) !== String(moduloId)) return;

    if (hasRedirected) return;

    const aulas = (contents ?? []).filter(
      (content: any) => !content?.content_type || content.content_type === "aula",
    );

    if (aulas.length === 0) return;

    const ordered = [...aulas].sort((a, b) => {
      const indexA = aulas.findIndex((lesson) => lesson.id === a.id);
      const indexB = aulas.findIndex((lesson) => lesson.id === b.id);

      const orderA = Number(
        a.order ?? a.ordem ?? a.position ?? a.pivot?.order ?? indexA,
      );

      const orderB = Number(
        b.order ?? b.ordem ?? b.position ?? b.pivot?.order ?? indexB,
      );

      return orderA - orderB;
    });

    let lastCompletedIndex = -1;

    ordered.forEach((lesson, index) => {
      if (isLessonCompleted(lesson)) {
        lastCompletedIndex = index;
      }
    });

    const nextAfterLastCompleted = ordered[lastCompletedIndex + 1];

    const firstUncompleted = ordered.find(
      (lesson) => !isLessonCompleted(lesson),
    );

    const targetLesson =
      nextAfterLastCompleted ?? firstUncompleted ?? ordered[0];

    if (!targetLesson) return;

    const slug = toSlug(targetLesson.title);

    const url = `/modulos/${moduloId}/${moduloSlug}/${targetLesson.id}/${slug}`;

    setHasRedirected(true);

    router.replace(url, {
      scroll: false,
    });
  }, [
    initialLoading,
    contents,
    loadedModuloId,
    moduloId,
    moduloSlug,
    hasRedirected,
    router,
  ]);

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120] shadow-2xl">
        <Skeleton
          variant="rectangular"
          animation="wave"
          className="h-[240px] w-full sm:h-[380px] lg:h-[600px]"
          sx={{
            bgcolor: "rgba(148, 163, 184, 0.10)",
          }}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Skeleton
          animation="wave"
          className="h-6 w-1/3 rounded-lg"
          sx={{
            bgcolor: "rgba(148, 163, 184, 0.12)",
          }}
        />

        <Skeleton
          animation="wave"
          className="h-4 w-1/2 rounded-lg"
          sx={{
            bgcolor: "rgba(148, 163, 184, 0.10)",
          }}
        />

        <Skeleton
          animation="wave"
          className="h-4 w-2/5 rounded-lg"
          sx={{
            bgcolor: "rgba(148, 163, 184, 0.08)",
          }}
        />
      </div>
    </div>
  );
}