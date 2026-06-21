// conteudo/tv/[slugId]/page.tsx
"use client";

import { api } from "@/lib/axios";
import { Skeleton } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Video,
  CalendarDays,
  Plus,
  BookOpen,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type PageProps = {
  params: Promise<{ slugId: string }>;
};

function ModuleCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-80 flex bg-[#0c0f1a] rounded-xl shadow-md overflow-hidden border-2 border-blue-800/30">
      <Skeleton
        variant="rectangular"
        animation="wave"
        width={112}
        height={112}
        className="!bg-white/10"
      />

      <div className="flex flex-col justify-between p-3 flex-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton
              variant="circular"
              animation="wave"
              width={16}
              height={16}
              className="!bg-blue-400/25"
            />
            <Skeleton
              variant="text"
              animation="wave"
              width="75%"
              height={20}
              className="!bg-white/15"
            />
          </div>

          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton
                  variant="circular"
                  animation="wave"
                  width={12}
                  height={12}
                  className="!bg-white/10"
                />
                <Skeleton
                  variant="text"
                  animation="wave"
                  width={index === 0 ? "38%" : "48%"}
                  height={16}
                  className="!bg-white/10"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              animation="wave"
              width={12}
              height={8}
              className="!bg-white/10"
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-2">
          <Skeleton
            variant="text"
            animation="wave"
            width="42%"
            height={16}
            className="!bg-white/10"
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={16}
            height={16}
            className="!bg-white/10"
          />
        </div>
      </div>
    </div>
  );
}

function FrenteSkeleton({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className="border border-blue-600 rounded-2xl overflow-hidden shadow-md">
      <div className="w-full px-6 py-4 bg-gradient-to-r from-blue-800 to-blue-900">
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col items-start w-full">
            <div className="flex items-center gap-2 w-full">
              <Skeleton
                variant="circular"
                animation="wave"
                width={20}
                height={20}
                className="!bg-white/20"
              />
              <Skeleton
                variant="text"
                animation="wave"
                width="38%"
                height={28}
                className="!bg-white/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 w-full">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Skeleton
                    variant="circular"
                    animation="wave"
                    width={16}
                    height={16}
                    className="!bg-blue-200/20"
                  />
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width={index === 3 ? 80 : 95}
                    height={18}
                    className="!bg-blue-200/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <Skeleton
            variant="circular"
            animation="wave"
            width={22}
            height={22}
            className="!bg-white/20"
          />
        </div>
      </div>

      {expanded && (
        <div className="relative border-t border-blue-600 rounded-b-2xl mt-2 p-3 bg-gradient-to-b from-[#0b0d1a] to-[#0d0f22] overflow-hidden">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full z-10 shadow-md">
            <Skeleton
              variant="circular"
              animation="wave"
              width={20}
              height={20}
              className="!bg-white/15"
            />
          </div>

          <div className="overflow-hidden px-4 py-4">
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <ModuleCardSkeleton key={index} />
              ))}
            </div>
          </div>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full z-10 shadow-md">
            <Skeleton
              variant="circular"
              animation="wave"
              width={20}
              height={20}
              className="!bg-white/15"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ConteudoCursoSkeleton() {
  return (
    <div className="w-full flex flex-col items-center text-white pb-5">
      <Skeleton
        variant="text"
        animation="wave"
        width={280}
        height={42}
        className="!bg-white/15 !mt-4"
      />

      <div className="mt-2 mb-6 flex flex-col items-center w-full px-6">
        <Skeleton
          variant="text"
          animation="wave"
          width="100%"
          height={22}
          className="!bg-white/10 max-w-2xl"
        />
        <Skeleton
          variant="text"
          animation="wave"
          width="72%"
          height={22}
          className="!bg-white/10 max-w-xl"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="w-full md:w-[180px] flex items-center gap-2 px-4 py-3 border-b-2 border-[#0E00D0]">
          <Skeleton
            variant="circular"
            animation="wave"
            width={20}
            height={20}
            className="!bg-white/20"
          />
          <Skeleton
            variant="text"
            animation="wave"
            width={90}
            height={24}
            className="!bg-white/20"
          />
        </div>

        <div className="w-full md:w-[190px] flex items-center gap-2 px-4 py-3 border-b-2 border-transparent">
          <Skeleton
            variant="circular"
            animation="wave"
            width={20}
            height={20}
            className="!bg-white/10"
          />
          <Skeleton
            variant="text"
            animation="wave"
            width={105}
            height={24}
            className="!bg-white/10"
          />
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto space-y-5 pb-8 px-4 md:px-0">
        <FrenteSkeleton expanded />
        <FrenteSkeleton />
        <FrenteSkeleton />
        <FrenteSkeleton />
      </div>
    </div>
  );
}

export default function ConteudoPage({ params }: PageProps) {
  const { slugId } = use(params);
  const { data: session, status } = useSession();

  const [dataB, setDataB] = useState<any[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>({});
  const [tvTipo, setTvTipo] = useState<string>("curso");
  const [loading, setLoading] = useState(true);
  const [openFrente, setOpenFrente] = useState<number | null>(null);
  const [hoveredModule, setHoveredModule] = useState<number | null>(null);

  const searchParams = useSearchParams();

  const targetFrenteId = searchParams.get("frente");
  const targetModuloId = searchParams.get("modulo");

  const frenteRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const moduloRefs = useRef<Record<number, HTMLAnchorElement | null>>({});
  const hasAppliedUrlFocus = useRef(false);

  const containerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const contentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [dragLimits, setDragLimits] = useState<{ [key: number]: number }>({});

  useDocumentTitle(courseInfo.name ?? "Curso");

  const toggleFrente = (id: number) => {
    setOpenFrente(openFrente === id ? null : id);
  };

  const scroll = (id: number, direction: "left" | "right") => {
    const container = containerRefs.current[id];

    if (container) {
      container.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const toSlug = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const formatTime = (totalSeconds: number): string => {
    if (!totalSeconds || totalSeconds <= 0) return "0m";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let result = "";

    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;

    return result.trim() || "0m";
  };

  const getDurationSeconds = (content: any): number => {
    return Number(
      content.duration_in_seconds ??
        content.estimated_time_minutes ??
        content.user_progress?.duration_seconds ??
        0,
    );
  };

  const isAula = (content: any): boolean => {
    return content?.content_type === "aula";
  };

  const isContentCompleted = (content: any): boolean => {
    if (!content) return false;

    const progress = content.user_progress;

    if (!progress) return false;

    return (
      progress.is_completed === true ||
      progress.is_completed === 1 ||
      progress.is_completed === "1" ||
      progress.is_completed === "true" ||
      Number(progress.progress_percent ?? 0) >= 90
    );
  };

  const calcularProgressoModulo = (modulo: any) => {
    const aulas = modulo.contents?.filter(isAula) ?? [];

    if (aulas.length === 0) return 0;

    const aulasCompletas = aulas.filter(isContentCompleted).length;

    return Math.round((aulasCompletas / aulas.length) * 100);
  };

  const isModuloCompleto = (modulo: any) => {
    const aulas = modulo.contents?.filter(isAula) ?? [];

    if (aulas.length === 0) return false;

    return aulas.every(isContentCompleted);
  };

  const calcularTotaisFrente = (frente: any) => {
    const totalModulos = frente.modules?.length || 0;
    let totalAulas = 0;
    let totalListas = 0;
    let totalSegundos = 0;

    frente.modules?.forEach((modulo: any) => {
      modulo.contents?.forEach((conteudo: any) => {
        if (conteudo.content_type === "aula") {
          totalAulas++;
          totalSegundos += getDurationSeconds(conteudo);
        } else if (conteudo.content_type === "lista") {
          totalListas++;
        }
      });
    });

    return {
      modulos: totalModulos,
      aulas: totalAulas,
      listas: totalListas,
      horas: Math.round(totalSegundos / 3600),
    };
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.laravelToken) {
      setLoading(false);
      setCourseInfo({});
      setDataB([]);
      return;
    }

    setLoading(true);

    Promise.all([
      api.get(`/coursesInfo`, {
        headers: { Authorization: `Bearer ${session.laravelToken}` },
      }),
      api.get(`/courses/${slugId}/fonts`, {
        headers: { Authorization: `Bearer ${session.laravelToken}` },
      }),
    ])
      .then(([infoRes, fontsRes]) => {
        setCourseInfo(infoRes.data ?? {});
        setDataB(fontsRes.data ?? []);
      })
      .catch((error) => {
        console.error("Erro ao carregar conteúdo do curso:", error);
        setCourseInfo({});
        setDataB([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slugId, session?.laravelToken, status]);

  useEffect(() => {
    if (openFrente === null) return;

    const container = containerRefs.current[openFrente];
    const content = contentRefs.current[openFrente];

    if (container && content) {
      const containerWidth = container.offsetWidth;
      const contentWidth = content.scrollWidth;
      const maxDrag = containerWidth - contentWidth;

      setDragLimits((prev) => ({
        ...prev,
        [openFrente]: maxDrag < 0 ? maxDrag : 0,
      }));
    }
  }, [openFrente, dataB]);

  useEffect(() => {
    if (loading) return;
    if (!dataB || dataB.length === 0) return;
    if (!targetFrenteId) return;
    if (hasAppliedUrlFocus.current) return;

    const frenteId = Number(targetFrenteId);

    const frenteExists = dataB.some(
      (frente: any) => Number(frente.id) === frenteId,
    );

    if (!frenteExists) return;

    setOpenFrente(frenteId);
  }, [loading, dataB, targetFrenteId]);

  useEffect(() => {
    if (loading) return;
    if (!targetFrenteId) return;
    if (openFrente !== Number(targetFrenteId)) return;
    if (hasAppliedUrlFocus.current) return;

    hasAppliedUrlFocus.current = true;

    window.setTimeout(() => {
      if (targetModuloId) {
        const moduloEl = moduloRefs.current[Number(targetModuloId)];

        if (moduloEl) {
          moduloEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });

          setHoveredModule(Number(targetModuloId));

          window.setTimeout(() => {
            setHoveredModule(null);
          }, 1800);

          return;
        }
      }

      const frenteEl = frenteRefs.current[Number(targetFrenteId)];

      if (frenteEl) {
        frenteEl.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 350);
  }, [loading, openFrente, targetFrenteId, targetModuloId]);

  if (loading) {
    return <ConteudoCursoSkeleton />;
  }

  return (
    <div className="w-full flex flex-col items-center text-white pb-5">
      {/* Cabeçalho */}
      <h1 className="text-2xl font-bold mt-4">{courseInfo.name}</h1>

      <p className="mt-2 mb-6 text-center max-w-2xl text-gray-300">
        {courseInfo.description}
      </p>

      {/* Abas */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <button
          onClick={() => setTvTipo("curso")}
          className={`cursor-pointer relative w-full md:w-2/3 flex items-center gap-2 px-4 py-3 border-b-2 transition font-semibold ${
            tvTipo === "curso"
              ? "border-[#0E00D0] text-white"
              : "border-transparent text-gray-300 hover:text-white"
          }`}
        >
          <Video
            className={`${tvTipo === "curso" ? "text-white" : "text-gray-400"}`}
            size={20}
          />
          <span>Conteúdo</span>
        </button>

        <button
          onClick={() => setTvTipo("cronograma")}
          className={`cursor-pointer flex items-center gap-2 px-4 py-3 border-b-2 transition font-semibold ${
            tvTipo === "cronograma"
              ? "border-[#0E00D0] text-white"
              : "border-transparent text-gray-600 hover:text-white"
          }`}
        >
          <CalendarDays
            className={`${
              tvTipo === "cronograma" ? "text-white" : "text-gray-600"
            }`}
            size={20}
          />
          <span>Cronograma</span>
        </button>
      </div>

      {/* Conteúdo */}
      {tvTipo === "curso" ? (
        <div className="w-full max-w-5xl mx-auto space-y-5 pb-8">
          {dataB.map((course) => {
            const totais = calcularTotaisFrente(course);

            return (
              <div
                key={course.id}
                className="border border-blue-600 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                ref={(el) => {
                  frenteRefs.current[course.id] = el;
                }}
              >
                {/* Cabeçalho da frente com totais */}
                <button
                  onClick={() => toggleFrente(course.id)}
                  className="cursor-pointer w-full flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg transition-all duration-300"
                >
                  <div className="flex flex-col items-start">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Frente: {course.name}
                    </span>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-normal text-blue-200">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {totais.modulos} módulos
                      </span>

                      <span className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        {totais.aulas} aulas
                      </span>

                      <span className="flex items-center gap-1">
                        <List className="w-4 h-4" />
                        {totais.listas} listas
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {totais.horas}h totais
                      </span>
                    </div>
                  </div>

                  {openFrente === course.id ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* Conteúdo expandido com animação */}
                <AnimatePresence initial={false}>
                  {openFrente === course.id && course.modules.length > 0 && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="relative border-t border-blue-600 rounded-b-2xl mt-2 p-3 bg-gradient-to-b from-[#0b0d1a] to-[#0d0f22] overflow-hidden"
                    >
                      {/* Botão esquerdo */}
                      <button
                        onClick={() => scroll(course.id, "left")}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 p-3 rounded-full z-10 shadow-md transition"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>

                      {/* Lista de módulos */}
                      <div
                        ref={(el) => {
                          containerRefs.current[course.id] = el;
                        }}
                        className="overflow-x-hidden scroll-smooth scrollbar-hide px-4 py-4"
                      >
                        <motion.div
                          ref={(el) => {
                            contentRefs.current[course.id] = el;
                          }}
                          drag="x"
                          dragConstraints={{
                            left: dragLimits[course.id] ?? 0,
                            right: 0,
                          }}
                          className="flex gap-4 cursor-grab active:cursor-grabbing"
                        >
                          {course.modules.map((mod: any) => {
                            const aulasModulo =
                              mod.contents?.filter(
                                (content: any) =>
                                  content.content_type === "aula",
                              ).length || 0;

                            const listasModulo =
                              mod.contents?.filter(
                                (content: any) =>
                                  content.content_type === "lista",
                              ).length || 0;

                            const totalSegundos =
                              mod.contents
                                ?.filter(isAula)
                                .reduce(
                                  (total: number, content: any) =>
                                    total + getDurationSeconds(content),
                                  0,
                                ) || 0;

                            const tempoModulo = formatTime(totalSegundos);
                            const progresso = calcularProgressoModulo(mod);
                            const moduloCompleto = isModuloCompleto(mod);

                            return (
                              <Link
                                key={mod.id}
                                href={`/modulos/${mod.id}/${toSlug(mod.name)}`}
                                ref={(el) => {
                                  moduloRefs.current[mod.id] = el;
                                }}
                                className="scroll-mt-24"
                              >
                                <div
                                  className={`flex-shrink-0 w-80 flex bg-[#0c0f1a] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 ${
                                    moduloCompleto
                                      ? "border-green-500"
                                      : hoveredModule === mod.id
                                        ? "border-blue-400"
                                        : "border-blue-800/30"
                                  }`}
                                  onMouseEnter={() => setHoveredModule(mod.id)}
                                  onMouseLeave={() => setHoveredModule(null)}
                                >
                                  <div className="flex-shrink-0 relative">
                                    <img
                                      src={
                                        mod.module_avatar ||
                                        "/default-module.jpg"
                                      }
                                      alt={mod.name}
                                      className="w-28 h-28 object-cover"
                                    />

                                    {moduloCompleto && (
                                      <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col justify-between p-3 flex-1 text-white">
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-400" />
                                        {mod.name}
                                      </h3>

                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                          <Clock className="w-3 h-3" />
                                          <span>{tempoModulo}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                          <Video className="w-3 h-3" />
                                          <span>{aulasModulo} aulas</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                          <List className="w-3 h-3" />
                                          <span>{listasModulo} listas</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {mod.contents
                                        ?.filter(isAula)
                                        .map((content: any) => (
                                          <div
                                            key={content.id}
                                            className={`h-2 w-3 rounded-sm ${
                                              isContentCompleted(content)
                                                ? "bg-green-500"
                                                : "bg-gray-600"
                                            }`}
                                            title={content.title}
                                          />
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-gray-400">
                                        {progresso}% completo
                                      </span>

                                      {moduloCompleto && (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      </div>

                      {/* Botão direito */}
                      <button
                        onClick={() => scroll(course.id, "right")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 p-3 rounded-full z-10 shadow-md transition"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center text-gray-300 mt-10 space-y-6">
          <Image
            src="https://cdn.principiamatematica.com/5c177ef5-985c-4977-abb1-1218a025c33d.png"
            alt="Ilustração de cronograma"
            width={300}
            height={300}
            className="mb-4"
          />

          <p className="text-[28px] font-semibold text-white max-w-2xl leading-snug">
            (EM BREVE)
          </p>

          <button className="cursor-pointer flex items-center justify-center gap-3 w-full md:w-auto px-8 py-5 rounded-2xl bg-[#0E00D0] text-white font-semibold text-lg hover:bg-[#1400FF] transition-all shadow-md">
            <Plus size={28} className="text-white" />
            <span>Criar Cronograma</span>
          </button>
        </div>
      )}
    </div>
  );
}
