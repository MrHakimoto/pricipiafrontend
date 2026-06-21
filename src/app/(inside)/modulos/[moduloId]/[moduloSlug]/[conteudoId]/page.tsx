"use client";

import { Skeleton } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useModuloStore } from "@/store/useModuloStore";

export default function ConteudoSemSlugRedirectPage() {
  const router = useRouter();
  const params = useParams();

  const { moduloId, moduloSlug, conteudoId } = params as {
    moduloId: string;
    moduloSlug: string;
    conteudoId: string;
  };

  const contents = useModuloStore((state) => state.contents);
  const initialLoading = useModuloStore((state) => state.initialLoading);
  const loadedModuloId = useModuloStore((state) => state.loadedModuloId);

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

  function getLessonOrder(lesson: any, index: number) {
    return Number(
      lesson.order ??
        lesson.ordem ??
        lesson.position ??
        lesson.pivot?.order ??
        index,
    );
  }

  function getOrderedLessons(lessons: any[]) {
    return [...lessons].sort((a, b) => {
      const indexA = lessons.findIndex((lesson) => lesson.id === a.id);
      const indexB = lessons.findIndex((lesson) => lesson.id === b.id);

      return getLessonOrder(a, indexA) - getLessonOrder(b, indexB);
    });
  }

  function pickBestLessonForModule(lessons: any[]) {
    const ordered = getOrderedLessons(lessons);

    if (ordered.length === 0) return null;

    let lastCompletedIndex = -1;

    ordered.forEach((lesson, index) => {
      if (lesson.user_progress?.is_completed) {
        lastCompletedIndex = index;
      }
    });

    const nextAfterLastCompleted = ordered[lastCompletedIndex + 1];

    if (nextAfterLastCompleted) {
      return nextAfterLastCompleted;
    }

    const firstUncompleted = ordered.find(
      (lesson) => !lesson.user_progress?.is_completed,
    );

    if (firstUncompleted) {
      return firstUncompleted;
    }

    return ordered[0];
  }

  useEffect(() => {
    if (initialLoading) return;

    if (String(loadedModuloId) !== String(moduloId)) return;

    if (!contents || contents.length === 0) return;

    const lessonFromUrl = contents.find(
      (lesson) => Number(lesson.id) === Number(conteudoId),
    );

    /**
     * Caso 1:
     * A aula existe no módulo.
     * Exemplo:
     * /modulos/5/equacoes/34
     *
     * Redireciona para:
     * /modulos/5/equacoes/34/o-que-e-uma-equacao
     */
    if (lessonFromUrl) {
      const canonicalSlug = toSlug(lessonFromUrl.title);

      router.replace(
        `/modulos/${moduloId}/${moduloSlug}/${lessonFromUrl.id}/${canonicalSlug}`,
        { scroll: false },
      );

      return;
    }

    /**
     * Caso 2:
     * O ID da aula não pertence a este módulo.
     * Exemplo:
     * /modulos/5/equacoes/3
     *
     * Redireciona para a aula correta do módulo.
     */
    const targetLesson = pickBestLessonForModule(contents);

    if (!targetLesson) return;

    router.replace(
      `/modulos/${moduloId}/${moduloSlug}/${targetLesson.id}/${toSlug(
        targetLesson.title,
      )}`,
      { scroll: false },
    );
  }, [
    initialLoading,
    loadedModuloId,
    moduloId,
    moduloSlug,
    conteudoId,
    contents,
    router,
  ]);

  return (
    <div className="w-full space-y-4 p-3 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 max-w-[70vw] rounded-xl bg-gray-700" />
          <Skeleton className="h-4 w-40 rounded-xl bg-gray-800" />
        </div>

        <Skeleton className="h-10 w-10 rounded-xl bg-gray-700" />
      </div>

      <div
        className="
          flex w-full items-center justify-center rounded-2xl border border-white/10
          bg-[#111827] h-[220px] min-[380px]:h-[240px] sm:h-[380px] lg:h-[560px]
        "
      >
        <div className="w-full max-w-md px-5 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />

          <p className="text-sm font-semibold text-white">
            Ajustando endereço da aula...
          </p>

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Redirecionando!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
        <Skeleton className="h-11 rounded-xl bg-gray-800 sm:w-32" />
        <Skeleton className="h-11 rounded-xl bg-gray-800 sm:w-32" />
        <Skeleton className="h-11 rounded-xl bg-gray-800 sm:w-32" />
      </div>
    </div>
  );
}