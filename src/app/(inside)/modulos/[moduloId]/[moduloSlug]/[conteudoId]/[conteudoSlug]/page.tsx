// modulos/[moduloId]/[moduloSlug]/[conteudoId]/[conteudoSlug]/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2,
  FileText,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SquareCheckBig,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useModuloStore } from "@/store/useModuloStore";
import { useSession } from "next-auth/react";
import ListaCursePage from "@/components/questions/CurseList";
import PdfViewerModal from "@/components/modules/PdfViewerModal";
import LessonCompletionToggle from "@/components/modules/LessonCompletionToggle";
import CommentCard from "@/components/modules/CommentCard";
import CommentSection from "@/components/modules/CommentSection";
import FavoriteButton from "@/components/card/FavoriteButton";

import { usePandaVideoProgress } from "@/hooks/usePandaVideoProgress";
import { DuvidaCard } from "@/components/modules/DuvidaCard";
import LikeButton from "@/components/modules/LikeButton";
import { toggleLike } from "@/lib/course/like";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface FileItem {
  file_url: string;
  file_name: string;
}

interface SelectedPdf {
  url: string;
  fileName: string;
  files?: FileItem[];
}

function VideoSkeleton() {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#101827]">
      <div className="flex h-full w-full flex-col items-center justify-center gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-white/5 dark:shadow-none">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="absolute h-16 w-16 animate-ping rounded-full border border-blue-500/20 dark:border-blue-400/20" />
        </div>

        <div className="w-full max-w-md space-y-3 px-8">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Carregando aula
        </p>
      </div>
    </div>
  );
}

export default function ConteudoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const { moduloId, moduloSlug, conteudoId, conteudoSlug } = params as {
    moduloId: string;
    moduloSlug: string;
    conteudoId: string;
    conteudoSlug: string;
  };

  const {
    contents,
    setCurrentContentId,
    currentContentType,
    setCurrentContentType,
    setShowAside,
    showAside,
    loadedModuloId,
    initialLoading,
    markLessonAsCompleted,
    markLessonAsUncompleted,
  } = useModuloStore();

  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"detalhes" | "duvidas">(
    "detalhes",
  );
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);

  const routeContentId = Number(conteudoId);

  const thisDataD = contents.find((content) => {
    const contentId = Number(content.id);
    const listId = getContentListId(content);

    if (contentId === routeContentId) {
      return true;
    }

    if (isListaContent(content) && listId === routeContentId) {
      return true;
    }

    return false;
  });

  const currentIndex = contents.findIndex(
    (content) => Number(content.id) === Number(thisDataD?.id),
  );

  const currentRealContentId = Number(thisDataD?.id ?? conteudoId);
  const currentListId = getContentListId(thisDataD);

  const attachmentsCount: number = thisDataD?.attachments?.length || 0;
  const isCompleted = Boolean(thisDataD?.user_progress?.is_completed);

  const hasProgress = (thisDataD?.user_progress?.last_watched_seconds || 0) > 5;

  const iframeId = `panda-player-${conteudoId}`;

  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;

    return localStorage.getItem("principia-autoplay") !== "false";
  });

  const isAula = thisDataD?.content_type === "aula";

  useDocumentTitle(thisDataD?.title ?? "Aula");

  const toggleAutoPlay = () => {
    setAutoPlayEnabled((current) => {
      const next = !current;

      localStorage.setItem("principia-autoplay", String(next));

      return next;
    });
  };

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

  function isListaContent(content: any) {
    return (
      String(content?.content_type ?? content?.type ?? "")
        .toLowerCase()
        .trim() === "lista"
    );
  }

  function getContentListId(content: any): number | null {
    const raw =
      content?.list_id ??
      content?.lista_id ??
      content?.lista?.id ??
      content?.list?.id ??
      content?.listaId;

    const id = Number(raw);

    return Number.isFinite(id) && id > 0 ? id : null;
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

    /**
     * Regra principal:
     * pega a aula posterior à última aula concluída.
     */
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

    /**
     * Fallback:
     * se não achou posterior, pega a primeira não concluída.
     */
    const firstUncompleted = ordered.find(
      (lesson) => !lesson.user_progress?.is_completed,
    );

    if (firstUncompleted) {
      return firstUncompleted;
    }

    /**
     * Se todas foram concluídas, volta para a primeira.
     */
    return ordered[0];
  }

  function buildLessonUrl(lesson: any) {
    const lessonIsLista = isListaContent(lesson);
    const lessonListId = getContentListId(lesson);

    const idForUrl = lessonIsLista && lessonListId ? lessonListId : lesson.id;

    return `/modulos/${moduloId}/${moduloSlug}/${idForUrl}/${toSlug(
      lesson.title,
    )}`;
  }

  useEffect(() => {
    if (initialLoading) return;

    if (String(loadedModuloId) !== String(moduloId)) return;

    if (!contents || contents.length === 0) return;

    if (thisDataD) return;

    const inProgress = contents
      .filter((lesson) => {
        const progress = lesson.user_progress;

        return (
          progress &&
          !progress.is_completed &&
          (progress.last_watched_seconds ?? 0) > 5
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.user_progress?.last_watched_at ?? 0).getTime();

        const dateB = new Date(b.user_progress?.last_watched_at ?? 0).getTime();

        return dateB - dateA;
      })[0];

    const firstUncompleted = contents.find(
      (lesson) => !lesson.user_progress?.is_completed,
    );

    const targetLesson = inProgress ?? firstUncompleted ?? contents[0];

    if (!targetLesson) return;

    const targetSlug = toSlug(targetLesson.title);

    const targetUrl = `/modulos/${moduloId}/${moduloSlug}/${targetLesson.id}/${targetSlug}`;

    console.warn("Corrigindo aula inválida da URL:", {
      moduloId,
      conteudoId,
      loadedModuloId,
      targetLessonId: targetLesson.id,
      targetUrl,
    });

    router.replace(targetUrl, {
      scroll: false,
    });
  }, [
    initialLoading,
    loadedModuloId,
    moduloId,
    moduloSlug,
    conteudoId,
    contents,
    thisDataD,
    router,
  ]);

  const handlePandaCompleted = useCallback(() => {
    markLessonAsCompleted(Number(conteudoId));

    const savedAutoPlay =
      typeof window !== "undefined"
        ? localStorage.getItem("principia-autoplay") !== "false"
        : true;

    if (!savedAutoPlay) return;

    const nextLesson = contents[currentIndex + 1];

    if (!nextLesson) return;

    const lessonSlug = toSlug(nextLesson.title);

    router.push(
      `/modulos/${moduloId}/${moduloSlug}/${nextLesson.id}/${lessonSlug}`,
    );
  }, [
    conteudoId,
    markLessonAsCompleted,
    contents,
    currentIndex,
    moduloId,
    moduloSlug,
    router,
  ]);

  const handlePandaProgressSaved = useCallback((progress: any) => {
    console.log("Progresso salvo:", progress);
  }, []);

  const { isSaving: pandaIsSaving } = usePandaVideoProgress({
    iframeId,
    contentId: Number(conteudoId),
    token: session?.laravelToken,
    enabled: Boolean(thisDataD?.content_url && isAula),
    initialSeconds: thisDataD?.user_progress?.last_watched_seconds ?? 0,
    initialDuration:
      thisDataD?.user_progress?.duration_seconds ??
      thisDataD?.duration_in_seconds ??
      0,
    initiallyCompleted: isCompleted,
    onCompleted: handlePandaCompleted,
    onProgressSaved: handlePandaProgressSaved,
  });

  useEffect(() => {
    if (thisDataD) {
      setCurrentContentId(currentRealContentId);
      setCurrentContentType(thisDataD.content_type);
    }
  }, [conteudoId, thisDataD, setCurrentContentId, setCurrentContentType]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!thisDataD?.content_url || !isAula) {
      setVideoLoading(false);
      return;
    }

    setVideoLoading(true);

    const timeout = window.setTimeout(() => {
      setVideoLoading(false);
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, [thisDataD?.id, thisDataD?.content_url, isAula]);

  const goToLesson = (lesson: any) => {
    if (!lesson) return;

    const lessonSlug = toSlug(lesson.title);

    router.push(
      `/modulos/${moduloId}/${moduloSlug}/${lesson.id}/${lessonSlug}`,
    );
  };

  const handleNextLesson = () => {
    const nextLesson = contents[currentIndex + 1];
    if (!nextLesson) return;

    goToLesson(nextLesson);
  };

  const handlePreviousLesson = () => {
    const previousLesson = contents[currentIndex - 1];
    if (!previousLesson) return;

    goToLesson(previousLesson);
  };

  const handleCompletionChange = async (
    lessonId: number,
    completed: boolean,
  ) => {
    if (completed) {
      markLessonAsCompleted(lessonId);
    } else {
      markLessonAsUncompleted(lessonId);
    }
  };

  const handleOpenPdf = (url: string, fileName: string) => {
    setSelectedPdf({
      url,
      fileName,
      files: thisDataD?.attachments?.map((attachment) => ({
        file_url: attachment.file_url,
        file_name: attachment.file_name,
      })) ?? [{ file_url: url, file_name: fileName }],
    });
  };

  if (
    initialLoading ||
    !thisDataD ||
    String(loadedModuloId) !== String(moduloId)
  ) {
    const moduleLoaded = String(loadedModuloId) === String(moduloId);
    const moduleIsEmpty =
      moduleLoaded && !initialLoading && contents.length === 0;

    return (
      <div className="w-full space-y-4 text-slate-900 dark:text-white">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 max-w-[70vw] rounded-xl bg-slate-200 dark:bg-gray-700" />
            <Skeleton className="h-4 w-40 rounded-xl bg-slate-200 dark:bg-gray-800" />
          </div>

          <Skeleton className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-gray-700" />
        </div>

        <div
          className="
          flex w-full items-center justify-center rounded-2xl border border-slate-200
          bg-white dark:border-white/10 dark:bg-[#111827] h-[220px] min-[380px]:h-[240px] sm:h-[380px] lg:h-[560px]
        "
        >
          <div className="w-full max-w-md px-5 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />

            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {moduleIsEmpty
                ? "Nenhuma aula cadastrada neste módulo."
                : moduleLoaded
                  ? "Preparando aula..."
                  : "Carregando aula..."}
            </p>

            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {moduleLoaded
                ? "A URL pode estar apontando para uma aula inválida ou com slug incorreto."
                : "Estamos carregando o conteúdo e seu progresso."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
          <Skeleton className="h-11 rounded-xl bg-slate-200 sm:w-32 dark:bg-gray-800" />
          <Skeleton className="h-11 rounded-xl bg-slate-200 sm:w-32 dark:bg-gray-800" />
          <Skeleton className="h-11 rounded-xl bg-slate-200 sm:w-32 dark:bg-gray-800" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0B1220] dark:shadow-none">
          <Skeleton className="mb-3 h-6 w-32 rounded-xl bg-slate-200 dark:bg-gray-700" />
          <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  const handleManualCompletionToggle = () => {
    handleCompletionChange(thisDataD.id, !isCompleted);
  };

  return (
    <div className="text-slate-900 dark:text-white">
      {/* 🔥 BOTÃO ABRIR ASIDE NO MOBILE */}
      {/* {isMobile && !showAside && (
        <button
          onClick={() => setShowAside(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
        >
          <Menu size={18} />
          Ver Aulas
        </button>
      )} */}

      {/* TÍTULO */}
      {/* TÍTULO + CONTROLE DO ASIDE */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {!(isMobile && currentContentType !== "aula") && (
            <h1 className="break-words text-xl font-bold leading-tight text-slate-950 dark:text-white sm:text-2xl">
              {thisDataD.title}
            </h1>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* {isCompleted && (
              <span className="rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
                Concluída
              </span>
            )}

            {hasProgress && !isCompleted && (
              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                Em andamento
              </span>
            )} */}
          </div>
        </div>

        {isMobile ||
          (!showAside && (
            <button
              type="button"
              onClick={() => setShowAside(!showAside)}
              aria-label={showAside ? "Ocultar aulas" : "Mostrar aulas"}
              title={showAside ? "Ocultar aulas" : "Mostrar aulas"}
              className="cursor-pointer
        mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center
        rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm
        transition hover:bg-slate-50 active:scale-95
        dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15
      "
            >
              {showAside ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </button>
          ))}
      </div>

      {/* CONTEÚDO DINÂMICO */}
      {currentContentType === "aula" ? (
        <div className="text-slate-900 dark:text-white">
          {/* PLAYER DE VÍDEO SIMPLES */}
          <div className="mb-6">
            <div
              className="
      relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm dark:border-white/10
      h-[240px]
      min-[380px]:h-[260px]
      sm:h-[380px]
      lg:h-[600px]
    "
            >
              {videoLoading && <VideoSkeleton />}

              {thisDataD?.content_url && (
                <iframe
                  key={thisDataD.id}
                  id={iframeId}
                  src={thisDataD.content_url}
                  className={`h-full w-full border-0 bg-black transition-opacity duration-300 ${
                    videoLoading ? "opacity-0" : "opacity-100"
                  }`}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => {
                    console.log("✅ Iframe Panda carregado");
                    setVideoLoading(false);
                  }}
                  onError={() => {
                    console.error("❌ Erro ao carregar iframe Panda");
                    setVideoLoading(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* BOTÕES DE NAVEGAÇÃO */}
          <div className="hidden sm:block">
            <div className="w-full mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap sm:flex-nowrap sm:justify-between gap-2 sm:gap-4">
                {/* 🔹 Botões de Like / Favoritar / Anexo */}
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <LikeButton
                    token={session?.laravelToken}
                    entityType="aula"
                    entityId={Number(conteudoId)}
                    label="Curtir aula"
                  />

                  <FavoriteButton
                    token={session?.laravelToken}
                    entityType="aula"
                    entityId={Number(conteudoId)}
                    label="Salvar aula"
                  />

                  {attachmentsCount > 0 && (
                    <button
                      onClick={() =>
                        thisDataD.attachments &&
                        thisDataD.attachments.length > 0 &&
                        handleOpenPdf(
                          thisDataD.attachments[0].file_url,
                          thisDataD.attachments[0].file_name,
                        )
                      }
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-sm sm:text-base dark:border-gray-600 dark:bg-transparent dark:text-slate-200 dark:hover:bg-gray-700/30"
                    >
                      <Link2 size={16} />
                      Anexo ({attachmentsCount})
                    </button>
                  )}
                </div>

                {/* 🔹 Controles da aula */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAutoPlay}
                    role="switch"
                    aria-checked={autoPlayEnabled}
                    title={
                      autoPlayEnabled
                        ? "Auto Play ativado"
                        : "Auto Play desativado"
                    }
                    className={`
      group relative inline-flex h-[30px] w-[48px] shrink-0 cursor-pointer items-center
      rounded-md border-[3px] border-transparent shadow-sm transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
      ${autoPlayEnabled ? "bg-blue-600/90" : "bg-slate-300 dark:bg-gray-700"}
    `}
                  >
                    <span
                      className={`
        pointer-events-none flex h-full w-6 items-center justify-center rounded-sm
        bg-white text-blue-700 transition-transform
        ${autoPlayEnabled ? "translate-x-[18px]" : "translate-x-0"}
      `}
                    >
                      {autoPlayEnabled ? (
                        <Play size={14} fill="currentColor" />
                      ) : (
                        <Pause size={14} fill="currentColor" />
                      )}
                    </span>
                  </button>

                  <div className="flex flex-row gap-0">
                    <button
                      type="button"
                      onClick={handlePreviousLesson}
                      disabled={currentIndex <= 0}
                      aria-label="Aula anterior"
                      title="Aula anterior"
                      className=" cursor-pointer
        inline-flex h-8 w-9 items-center justify-center rounded-l-lg rounded-r-none
        border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
        disabled:pointer-events-none disabled:opacity-40
      "
                    >
                      <SkipBack size={16} />
                    </button>

                    <div className="h-8 w-[2px] bg-slate-200 dark:bg-[#00091A]" />

                    <button
                      type="button"
                      onClick={handleNextLesson}
                      disabled={currentIndex >= contents.length - 1}
                      aria-label="Próxima aula"
                      title="Próxima aula"
                      className="cursor-pointer
        inline-flex h-8 w-9 items-center justify-center rounded-r-lg rounded-l-none
        border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
        disabled:pointer-events-none disabled:opacity-40
      "
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>

                  {/* <div
                  className={`
    inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium transition
    ${
      isCompleted
        ? "border-green-500/30 bg-green-600 text-white"
        : "border-gray-700 bg-gray-800/70 text-gray-200"
    }
  `}
                >
                  <LessonCompletionToggle
                    lessonId={thisDataD.id}
                    isCompleted={isCompleted}
                    onCompletionChange={handleCompletionChange}
                    size={20}
                  />

                  <span>{isCompleted ? "Assistida" : "Concluir"}</span>
                </div> */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handleManualCompletionToggle}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleManualCompletionToggle();
                      }
                    }}
                    className={`
    cursor-pointer inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-medium transition
    ${
      isCompleted
        ? "border-green-500/30 bg-green-600 text-white"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-gray-700"
    }
  `}
                  >
                    <SquareCheckBig size={16} />
                    <span>{isCompleted ? "Assistida" : "Concluir"}</span>
                  </div>
                </div>
              </div>

              {/* 🔹 Indicador de progresso */}
              {/* {hasProgress && !isCompleted && (
                <div className="text-blue-400 text-sm bg-blue-900/20 p-3 rounded-md">
                  📚 Continue assistindo para concluir esta aula
                </div>
              )} */}
            </div>
          </div>

          {/* AÇÕES MOBILE - bloco novo compacto */}
          {/* AÇÕES MOBILE */}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:hidden dark:border-white/10 dark:bg-white/[0.035] dark:shadow-none">
            <div className="grid grid-cols-5 gap-2">
              <div className="[&_button]:h-11 [&_button]:w-full [&_svg]:h-5 [&_svg]:w-5">
                <LikeButton
                  token={session?.laravelToken}
                  entityType="aula"
                  entityId={Number(conteudoId)}
                  label="Curtir"
                  compact
                />
              </div>

              <div className="[&_button]:h-11 [&_button]:w-full [&_svg]:h-5 [&_svg]:w-5">
                <FavoriteButton
                  token={session?.laravelToken}
                  entityType="aula"
                  entityId={Number(conteudoId)}
                  label="Salvar"
                  compact
                />
              </div>

              <button
                type="button"
                onClick={toggleAutoPlay}
                role="switch"
                aria-checked={autoPlayEnabled}
                aria-label={
                  autoPlayEnabled ? "Desativar Auto Play" : "Ativar Auto Play"
                }
                title={
                  autoPlayEnabled ? "Auto Play ativado" : "Auto Play desativado"
                }
                className={`
        group relative inline-flex h-11 w-full items-center justify-center overflow-hidden
        rounded-xl border transition-all duration-300 active:scale-95
        ${
          autoPlayEnabled
            ? "border-blue-500/50 bg-blue-600/15 text-blue-700 shadow-[0_0_18px_rgba(37,99,235,0.18)] dark:bg-blue-600/20 dark:text-blue-100 dark:shadow-[0_0_18px_rgba(37,99,235,0.25)]"
            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        }
      `}
              >
                <span
                  className={`
          absolute inset-1 rounded-lg transition-all duration-300
          ${autoPlayEnabled ? "bg-blue-500/10 dark:bg-blue-500/15" : "bg-slate-100 dark:bg-slate-800/70"}
        `}
                />

                <span
                  className={`
          absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg
          bg-white shadow-md transition-all duration-300 dark:bg-white/90
          ${
            autoPlayEnabled
              ? "translate-x-3 text-blue-700"
              : "-translate-x-3 text-slate-700"
          }
        `}
                >
                  {autoPlayEnabled ? (
                    <Play className="h-4 w-4 fill-current" />
                  ) : (
                    <Pause className="h-4 w-4 fill-current" />
                  )}
                </span>

                {autoPlayEnabled && (
                  <span className="absolute inset-0 animate-pulse rounded-xl border border-blue-400/30" />
                )}
              </button>

              <button
                type="button"
                onClick={handlePreviousLesson}
                disabled={currentIndex <= 0}
                aria-label="Aula anterior"
                title="Aula anterior"
                className="
        inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200
        bg-slate-50 text-slate-600 transition active:scale-95
        hover:bg-slate-100 hover:text-slate-950
        dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white
        disabled:pointer-events-none disabled:opacity-40
      "
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNextLesson}
                disabled={currentIndex >= contents.length - 1}
                aria-label="Próxima aula"
                title="Próxima aula"
                className="
        inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200
        bg-slate-50 text-slate-600 transition active:scale-95
        hover:bg-slate-100 hover:text-slate-950
        dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white
        disabled:pointer-events-none disabled:opacity-40
      "
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualCompletionToggle}
              className={`
      mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border
      text-sm font-bold transition active:scale-[0.99]
      ${
        isCompleted
          ? "border-green-500/40 bg-green-500/15 text-green-700 dark:text-green-200"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
      }
    `}
            >
              <SquareCheckBig className="h-5 w-5" />
              {isCompleted ? "Assistida" : "Concluir"}
            </button>
          </div>

          {/* SEÇÃO DE COMENTÁRIOS */}
          {/* SEÇÃO INFERIOR: DETALHES / DÚVIDAS / COMENTÁRIOS */}
          <div className="mt-6 sm:mt-8">
            <div className="max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0B1220] dark:shadow-none">
              <div className="flex border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
                {thisDataD.description && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("detalhes")}
                    className={`
            flex-1 px-3 py-3 text-sm font-bold transition sm:flex-none sm:px-5 sm:text-lg
            ${
              activeTab === "detalhes"
                ? "bg-slate-200 text-slate-950 dark:bg-white/10 dark:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            }
          `}
                  >
                    Detalhes
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab("duvidas")}
                  className={` cursor-pointer
          flex-1 px-3 py-3 text-sm font-bold transition sm:flex-none sm:px-5 sm:text-lg
          ${
            activeTab === "duvidas"
              ? "bg-slate-200 text-slate-950 dark:bg-white/10 dark:text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          }
        `}
                >
                  Dúvidas
                </button>
              </div>

              <div className="p-3 text-sm text-slate-700 dark:text-gray-300 sm:p-5">
                {activeTab === "detalhes" && thisDataD.description ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="leading-relaxed">{thisDataD.description}</p>
                    </div>

                    {attachmentsCount > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <h4 className="mb-3 text-base font-bold text-slate-950 dark:text-white">
                          Arquivos da Aula ({attachmentsCount})
                        </h4>

                        <div className="space-y-2">
                          {thisDataD.attachments?.map((attachment, index) => (
                            <div
                              key={attachment.id || index}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
                            >
                              <FileText
                                size={20}
                                className="shrink-0 text-blue-400"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-slate-900 dark:text-white">
                                  {attachment.file_name}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPdf(
                                    attachment.file_url,
                                    attachment.file_name,
                                  )
                                }
                                className="shrink-0 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-500/20 dark:text-blue-300"
                              >
                                Ver
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <DuvidaCard
                    courseContentId={Number(conteudoId)}
                    enunciado={thisDataD.title}
                  />
                )}
              </div>
            </div>

            <section className="mt-6 max-w-6xl sm:mt-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                  Comentários e Discussões
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Comente sobre a aula ou acompanhe a discussão dos alunos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0B1220] dark:shadow-none sm:p-5">
                <CommentSection courseContentId={Number(conteudoId)} />
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="text-slate-900 dark:text-white">
          <ListaCursePage idList={currentListId ?? routeContentId} />
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE PDF */}
      {selectedPdf && (
        <PdfViewerModal
          onClose={() => setSelectedPdf(null)}
          files={
            selectedPdf.files || [
              { file_url: selectedPdf.url, file_name: selectedPdf.fileName },
            ]
          }
        />
      )}
    </div>
  );
}
