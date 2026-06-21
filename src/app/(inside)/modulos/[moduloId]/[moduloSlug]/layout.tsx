// modulos/[moduloId]/[moduloSlug]/layout.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  List,
  X,
  PanelRightClose,
} from "lucide-react";
import { useModuloStore } from "@/store/useModuloStore";
import { useSession } from "next-auth/react";
import { getModuloContents } from "@/lib/course/course";
import { motion, AnimatePresence } from "framer-motion";
import LessonCompletionToggle from "@/components/modules/LessonCompletionToggle";

export default function ModuloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const { moduloId, moduloSlug, conteudoId } = params as {
    moduloId: string;
    moduloSlug: string;
    conteudoId?: string;
  };

  const {
    contents,
    showAside,
    setShowAside,
    currentLink,
    currentContentId,
    loadedModuloId,
    initialLoading,
    setContents,
    setLoadedModuloId,
    setInitialLoading,
    setCurrentLink,
    markLessonAsCompleted,
    markLessonAsUncompleted,
  } = useModuloStore();

  const [isMobile, setIsMobile] = useState(false);
  const { data: session, status } = useSession();

  // 🔥 CALCULAR PROGRESSO DO MÓDULO
  const calculateModuleProgress = () => {
    if (contents.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completedLessons = contents.filter(
      (lesson) => lesson.user_progress?.is_completed,
    ).length;

    const percentage = (completedLessons / contents.length) * 100;

    return {
      completed: completedLessons,
      total: contents.length,
      percentage: Math.round(percentage),
    };
  };

  const moduleProgress = calculateModuleProgress();

  // 🔥 DETECTAR SE É MOBILE
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModuleData() {
      if (status === "loading") return;

      if (status !== "authenticated" || !session?.laravelToken || !moduloId) {
        setInitialLoading(false);
        return;
      }

      const isSameModuleLoaded =
        String(loadedModuloId) === String(moduloId) && contents.length > 0;

      if (isSameModuleLoaded) {
        setInitialLoading(false);
        return;
      }

      console.log(`Layout: Buscando dados para módulo ${moduloId}...`);

      setInitialLoading(true);

      // IMPORTANTÍSSIMO:
      // evita mostrar/redirecionar usando aulas persistidas do módulo anterior
      setContents([]);

      try {
        const response = await getModuloContents(
          moduloId,
          session.laravelToken,
        );

        if (cancelled) return;

        const contentsData = response.contents || [];
        const moduleInfo = response.module_info || {};

        setContents(contentsData);
        setLoadedModuloId(String(moduloId));

        if (moduleInfo && moduleInfo.course_id) {
          setCurrentLink({
            course_id: moduleInfo.course_id,
            course_name: moduleInfo.course_name,
            frente_id: moduleInfo.frente_id,
            frente_name: moduleInfo.frente_name,
            module_name: moduleInfo.module_name,
          });
        }

        console.log("✅ Dados do módulo carregados:", {
          moduloId,
          total: contentsData.length,
        });
      } catch (error) {
        if (!cancelled) {
          console.error("❌ Falha ao carregar dados do módulo:", error);
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    loadModuleData();

    return () => {
      cancelled = true;
    };
  }, [
    status,
    moduloId,
    session?.laravelToken,
    loadedModuloId,
    contents.length,
    setContents,
    setLoadedModuloId,
    setInitialLoading,
    setCurrentLink,
  ]);

  useEffect(() => {
    if (initialLoading) return;

    if (String(loadedModuloId) !== String(moduloId)) return;

    if (!contents || contents.length === 0) return;

    const isInsideLessonPage = Boolean(conteudoId);

    if (isInsideLessonPage) return;

    const slugify = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

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

    const slug = slugify(targetLesson.title);

    router.replace(
      `/modulos/${moduloId}/${moduloSlug}/${targetLesson.id}/${slug}`,
      { scroll: false },
    );
  }, [
    initialLoading,
    loadedModuloId,
    contents,
    conteudoId,
    moduloId,
    moduloSlug,
    router,
  ]);

  const goToLesson = (lesson: any) => {
    const slug = lesson.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    router.push(`/modulos/${moduloId}/${moduloSlug}/${lesson.id}/${slug}`, {
      scroll: false,
    });

    if (isMobile) {
      setShowAside(false);
    }
  };

  // 🔥 FORMATAR TEMPO
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 🔥 HANDLE COMPLETION CHANGE
  const handleCompletionChange = (lessonId: number, completed: boolean) => {
    if (completed) {
      markLessonAsCompleted(lessonId);
    } else {
      markLessonAsUncompleted(lessonId);
    }
  };

  // 🔥 VARIAÇÕES DE ANIMAÇÃO
  const asideVariants = {
    open: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 280,
        damping: 32,
        mass: 0.8,
      },
    },
    closed: {
      x: "100%",
      opacity: 0,
      scale: 0.98,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 30,
        mass: 0.8,
      },
    },
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
    closed: {
      x: 20,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className="flex flex-col overflow-hidden bg-[#F8F8F8] text-slate-950 dark:bg-[#00091A] dark:text-white">
      {/* 🔥 BOTÃO FIXO PARA ABRIR ASIDE - APENAS MOBILE */}
      {/* {!showAside && isMobile && (
        <button
          onClick={() => setShowAside(true)}
          className="cursor-pointer fixed right-4 top-1/2 transform -translate-y-1/2 z-40 bg-white hover:bg-slate-100 text-slate-900 p-3 rounded-full shadow-lg border border-slate-300 transition-all duration-300 hover:scale-110 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
        ></button>
      )} */}

      <div className="lg:px-6 px-1 outfit w-full">
        {/* 🔥 HEADER FIXO COM BOTÃO FECHAR/ABRIR ASIDE */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            title="Voltar"
            className="
      inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full
      border border-slate-200 bg-white text-slate-700 shadow-sm transition
      hover:bg-slate-50 active:scale-95
      dark:border-transparent dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700
    "
          >
            <ChevronLeft size={16} />
          </button>

          {currentLink && (
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto text-sm text-slate-600 scrollbar-thin scrollbar-thumb-slate-300 dark:text-gray-300 dark:scrollbar-thumb-white/10">
              <button
                type="button"
                onClick={() =>
                  router.push(`/conteudo/tv/${currentLink.course_id}`)
                }
                className="cursor-pointer
    shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1
    font-medium shadow-sm backdrop-blur-sm transition-colors duration-200
    hover:bg-slate-50 hover:text-slate-950
    dark:border-transparent dark:bg-gray-800/50 dark:shadow-none
    dark:hover:bg-gray-700/50 dark:hover:text-white
  "
              >
                {currentLink.course_name}
              </button>

              <ChevronRight
                size={14}
                className="shrink-0 text-slate-400 dark:text-gray-500"
              />

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/conteudo/tv/${currentLink.course_id}?frente=${currentLink.frente_id}`,
                  )
                }
                className="cursor-pointer
    shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1
    font-medium shadow-sm backdrop-blur-sm transition-colors duration-200
    hover:bg-slate-50 hover:text-slate-950
    dark:border-transparent dark:bg-gray-800/50 dark:shadow-none
    dark:hover:bg-gray-700/50 dark:hover:text-white
  "
              >
                {currentLink.frente_name}
              </button>

              <ChevronRight
                size={14}
                className="shrink-0 text-slate-400 dark:text-gray-500"
              />

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/conteudo/tv/${currentLink.course_id}?frente=${currentLink.frente_id}&modulo=${moduloId}`,
                  )
                }
                className="cursor-pointer
    shrink-0 whitespace-nowrap rounded-lg border border-blue-500/30
    bg-blue-600/10 px-3 py-1 font-semibold text-[#0E00D0] backdrop-blur-sm
    transition hover:bg-blue-600/15
    dark:bg-blue-600/20 dark:text-white dark:hover:bg-blue-600/30
  "
              >
                {currentLink.module_name}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 🔥 CONTEÚDO PRINCIPAL - PROPORÇÃO DINÂMICA */}
          <div
            className={`transition-all duration-300 ${
              showAside && !isMobile ? "lg:w-3/4 w-full" : "w-full"
            }`}
          >
            {children}
          </div>

          {/* 🔥 OVERLAY PARA MOBILE COM ANIMAÇÃO */}
          <AnimatePresence>
            {isMobile && showAside && (
              <motion.div
                key="overlay"
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden dark:bg-black/60"
                onClick={() => setShowAside(false)}
              />
            )}
          </AnimatePresence>

          {/* 🔥 ASIDE PRINCIPAL COM FRAMER MOTION */}
          <AnimatePresence>
            {(showAside || !isMobile) && (
              <motion.div
                key="aside"
                variants={asideVariants}
                initial={isMobile ? "closed" : false}
                animate={showAside ? "open" : "closed"}
                exit="closed"
                className={`
  ${
    isMobile
      ? "fixed inset-y-0 right-0 z-50 w-[86vw] max-w-[360px]"
      : showAside
        ? "shrink-0 lg:relative lg:block lg:w-[390px] xl:w-[420px]"
        : "lg:hidden"
  }
`}
              >
                {/*  DIV FANTASMA PARA ALINHAR COM O TÍTULO DO VÍDEO */}
                {/* <div className="hidden lg:block h-[72px] mb-4"></div> */}

                <div
                  className={`
    overflow-hidden border border-slate-200 bg-white shadow-2xl
    dark:border-white/10 dark:bg-[#172131]
    ${isMobile ? "h-full rounded-l-3xl" : "rounded-2xl"}
  `}
                >
                  {/* HEADER DO ASIDE */}
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#172131]/95">
                    <div className="flex items-center gap-3">
                      {!isMobile && (
                        <button
                          type="button"
                          onClick={() => setShowAside(false)}
                          aria-label="Ocultar aulas"
                          title="Ocultar aulas"
                          className="cursor-pointer
          inline-flex h-9 w-9 items-center justify-center rounded-xl
          border border-slate-200 bg-slate-50 text-slate-700 transition
          hover:bg-slate-100 active:scale-95
          dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15
        "
                        >
                          <PanelRightClose className="h-4 w-4" />
                        </button>
                      )}

                      <div>
                        <h4 className="text-base font-bold text-slate-950 dark:text-white">
                          Aulas
                        </h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {contents.length} aulas
                        </p>
                      </div>
                    </div>

                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => setShowAside(false)}
                        aria-label="Fechar aulas"
                        title="Fechar aulas"
                        className="
        inline-flex h-9 w-9 items-center justify-center rounded-xl
        border border-slate-200 bg-slate-50 text-slate-700 transition
        hover:bg-slate-100 active:scale-95
        dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15
      "
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* LISTA DE AULAS COM ANIMAÇÃO ESCALONADA */}
                  <div
                    className={`overflow-x-hidden overflow-y-auto ${isMobile ? "h-[calc(100%-200px)]" : "max-h-[415px]"}`}
                  >
                    <AnimatePresence>
                      {contents.map((lesson, index) => {
                        const totalSeconds = lesson.duration_in_seconds || 0;
                        const formattedTime = formatTime(totalSeconds);
                        const isActive = currentContentId === lesson.id;
                        const isCompleted =
                          lesson.user_progress?.is_completed || false;
                        const hasProgress =
                          (lesson.user_progress?.last_watched_seconds || 0) > 5;

                        return (
                          <motion.div
                            key={lesson.id}
                            custom={index}
                            variants={itemVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            onClick={() => goToLesson(lesson)}
                            className={`
    group my-1 flex min-h-[54px] cursor-pointer items-center gap-3 rounded-xl
    border border-transparent px-3 py-2 transition
    hover:border-slate-200 hover:bg-slate-100
    dark:hover:border-white/10 dark:hover:bg-white/10
    ${
      isActive
        ? "border-blue-500/30 bg-blue-600/10 text-slate-950 dark:bg-white/10 dark:text-white"
        : "text-slate-600 dark:text-slate-400"
    }
    ${isCompleted ? "border-l-4 border-l-green-500" : ""}
  `}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.985 }}
                          >
                            <div
                              className="shrink-0"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <LessonCompletionToggle
                                lessonId={lesson.id}
                                isCompleted={isCompleted}
                                onCompletionChange={handleCompletionChange}
                                size={30}
                              />
                            </div>

                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <div
                                className={`
        inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
        ${
          isActive
            ? "bg-blue-600/15 text-[#0E00D0] dark:bg-blue-600/20 dark:text-blue-200"
            : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
        }
      `}
                              >
                                {lesson.content_type === "aula" ? (
                                  <Play className="h-3.5 w-3.5" />
                                ) : (
                                  <List className="h-3.5 w-3.5" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold leading-5">
                                  {lesson.title}
                                </p>

                                {hasProgress && !isCompleted && (
                                  <p className="mt-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                                    Continue assistindo
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="shrink-0 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                              {formattedTime}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* 🔥 BARRA DE PROGRESSO DO MÓDULO ATUALIZADA */}
                  <motion.div
                    className="sticky bottom-0 w-full border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-[#172131]/95"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold text-slate-950 dark:text-white">
                        {currentLink?.module_name || moduloSlug}
                      </h3>
                      <span
                        className={
                          moduleProgress.percentage === 100
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-400"
                        }
                      >
                        {moduleProgress.completed}/{moduleProgress.total}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          moduleProgress.percentage === 100
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${moduleProgress.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-gray-400">
                      <span>
                        {moduleProgress.percentage === 100
                          ? "🎉 Módulo concluído!"
                          : `${moduleProgress.percentage}% completo`}
                      </span>
                      {moduleProgress.percentage > 0 &&
                        moduleProgress.percentage < 100 && (
                          <span>
                            {moduleProgress.completed} de {moduleProgress.total}{" "}
                            aulas
                          </span>
                        )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}