"use client";

import { api } from "@/lib/axios";
import { Skeleton } from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState, use } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListVideo,
  List,
  Video,
  CalendarDays,
  Plus,
  BookOpen,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

type PageProps = {
  params: Promise<{ slugId: string }>;
};

export default function ConteudoPage({ params }: PageProps) {
  const { slugId } = use(params);
  const { data: session } = useSession();

  const [dataB, setDataB] = useState<any[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>({});
  const [tvTipo, setTvTipo] = useState<string>("curso");
  const [loading, setLoading] = useState(true);
  const [openFrente, setOpenFrente] = useState<number | null>(null);

  const containerRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const contentRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [dragLimits, setDragLimits] = useState<{ [key: number]: number }>({});

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

  // Função para calcular totais da frente
  const calcularTotaisFrente = (frente: any) => {
    let totalModulos = frente.modules?.length || 0;
    let totalAulas = 0;
    let totalListas = 0;
    let totalHoras = 0;

    frente.modules?.forEach((modulo: any) => {
      modulo.contents?.forEach((conteudo: any) => {
        if (conteudo.content_type === "aula") {
          totalAulas++;
          totalHoras += conteudo.estimated_time_minutes || 0;
        } else if (conteudo.content_type === "lista") {
          totalListas++;
        }
      });
    });

    // Converter minutos para horas
    const totalHorasFormatado = Math.round(totalHoras / 60);

    return {
      modulos: totalModulos,
      aulas: totalAulas,
      listas: totalListas,
      horas: totalHorasFormatado
    };
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/coursesInfo`, {
        headers: { Authorization: `Bearer ${session?.laravelToken}` },
      }),
      api.get(`/courses/${slugId}/fonts`, {
        headers: { Authorization: `Bearer ${session?.laravelToken}` },
      }),
    ])
      .then(([infoRes, fontsRes]) => {
        setCourseInfo(infoRes.data);
        setDataB(fontsRes.data);
      })
      .finally(() => setLoading(false));
  }, [slugId, session?.laravelToken]);

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

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center text-white">
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
        <div className="w-full max-w-5xl mx-auto space-y-5">
          {dataB.map((course) => {
            const totais = calcularTotaisFrente(course);
            
            return (
              <div
                key={course.id}
                className={`border border-blue-600 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300`}
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
                    <div className="flex items-center gap-4 mt-2 text-sm font-normal text-blue-200">
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
                        ref={(el) => (containerRefs.current[course.id] = el)}
                        className="overflow-x-hidden scroll-smooth scrollbar-hide px-4 py-4"
                      >
                        <motion.div
                          ref={(el) => (contentRefs.current[course.id] = el)}
                          drag="x"
                          dragConstraints={{
                            left: dragLimits[course.id] ?? 0,
                            right: 0,
                          }}
                          className="flex gap-4 cursor-grab active:cursor-grabbing"
                        >
                          {course.modules.map((mod: any) => {
                            // Calcular totais do módulo
                            const aulasModulo = mod.contents?.filter(
                              (content: any) => content.content_type === "aula"
                            ).length || 0;
                            
                            const listasModulo = mod.contents?.filter(
                              (content: any) => content.content_type === "lista"
                            ).length || 0;
                            
                            const tempoModulo = Math.round(
                              mod.contents?.reduce((total: number, content: any) => 
                                total + (content.estimated_time_minutes || 0), 0
                              ) / 60
                            );

                            return (
                              <Link
                                key={mod.id}
                                href={`/modulos/${mod.id}/${toSlug(mod.name)}`}
                              >
                                <div className="flex-shrink-0 w-80 flex bg-[#0c0f1a] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-blue-800/30">
                                  <div className="flex-shrink-0">
                                    <img
                                      src={mod.module_avatar || "/default-module.jpg"}
                                      alt={mod.name}
                                      className="w-28 h-28 object-cover"
                                    />
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
                                          <span>{tempoModulo}h</span>
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
                                    <div className="flex gap-1 mt-2">
                                      {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                          key={i}
                                          className={`h-2 w-3 rounded-sm ${
                                            i <= (mod.progresso || 0)
                                              ? "bg-green-500"
                                              : "bg-gray-600"
                                          }`}
                                        />
                                      ))}
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
          {/* Imagem acima do texto */}
          <Image
            src="https://cdn.principiamatematica.com/5c177ef5-985c-4977-abb1-1218a025c33d.png"
            alt="Ilustração de cronograma"
            width={300}
            height={300}
            className="mb-4"
          />

          <p className="text-[28px] font-semibold text-white max-w-2xl leading-snug">
            Para criar o seu cronograma personalizado G.E.P,
            clique no botão abaixo e defina suas configurações
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