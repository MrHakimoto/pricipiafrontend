"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight, ChevronLeft as ArrowLeft, Play, List, X } from "lucide-react";
import { useModuloStore } from "@/store/useModuloStore";
import { useSession } from "next-auth/react";
import { getModuloContents } from "@/lib/course/course";
import { motion, AnimatePresence } from "framer-motion";

export default function ModuloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const { moduloId, moduloSlug } = params as { moduloId: string; moduloSlug: string; };

  const {
    contents,
    showAside,
    setShowAside,
    currentLink,
    currentContentId,
    loadedModuloId,
    setContents,
    setLoadedModuloId,
    setInitialLoading
  } = useModuloStore();

  const [isMobile, setIsMobile] = useState(false);
  const { data: session, status } = useSession();

  // 🔥 DETECTAR SE É MOBILE
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadModuleData = async () => {
      if (status === 'authenticated' && moduloId) {

        if (loadedModuloId !== moduloId || contents.length === 0) {
          console.log(`Layout: Buscando dados para módulo ${moduloId}...`);
          setInitialLoading(true);

          try {
            const contentsData = await getModuloContents(moduloId, session.laravelToken);
            console.log("✅ Dados recebidos:", contentsData);

            setContents(contentsData);
            setLoadedModuloId(moduloId);

          } catch (error) {
            console.error(" Falha ao carregar dados do módulo:", error);
          } finally {
            setInitialLoading(false);
          }
        } else {
          console.log(`Layout: Dados do módulo [${moduloId}] já carregados.`);
          setInitialLoading(false);
        }
      }
    };

    if (status !== 'loading') {
      loadModuleData();
    }
  }, [status, moduloId, session, loadedModuloId, contents.length]);

  const goToLesson = (lesson: any) => {
    const slug = lesson.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    router.push(
      `/modulos/${moduloId}/${moduloSlug}/${lesson.id}/${slug}`,
      { scroll: false }
    );

    if (isMobile) {
      setShowAside(false);
    }
  };

  // 🔥 VARIAÇÕES DE ANIMAÇÃO
const asideVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: "tween" as const,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
  closed: {
    x: "100%",
    opacity: 0,
    transition: {
      type: "tween" as const,
      duration: 0.4,
      ease: "easeIn" as const,
    },
  },
};

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    }),
    closed: {
      x: 20,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="bg-[#00091A] text-white flex flex-col overflow-hidden">
      {/* 🔥 BOTÃO FIXO PARA ABRIR ASIDE - APENAS MOBILE */}
      {!showAside && isMobile && (
        <button
          onClick={() => setShowAside(true)}
          className="cursor-pointer fixed right-4 top-1/2 transform -translate-y-1/2 z-40 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg border border-gray-600 transition-all duration-300 hover:scale-110"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <div className="px-6 outfit w-full">
        {/* 🔥 HEADER FIXO COM BOTÃO FECHAR/ABRIR ASIDE */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => router.back()}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-800 hover:opacity-80"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            {currentLink && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <button
                  onClick={() => router.push(`/courses/${currentLink.course_id}`)}
                  className="hover:text-white transition-colors duration-200 font-medium px-3 py-1 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
                >
                  {currentLink.course_name}
                </button>
                <ChevronRight size={14} className="text-gray-500" />
                <button
                  onClick={() => router.push(`/frentes/${currentLink.frente_id}`)}
                  className="hover:text-white transition-colors duration-200 font-medium px-3 py-1 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
                >
                  {currentLink.frente_name}
                </button>
                <ChevronRight size={14} className="text-gray-500" />
                <span className="text-white font-semibold px-3 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm">
                  {currentLink.module_name}
                </span>
              </div>
            )}
          </div>

          {/* 🔥 BOTÃO COLADO NA DIREITA - MESMA LINHA DO HEADER */}
          {!isMobile && !showAside && (
            <button
              onClick={() => setShowAside(true)}
              className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110 group border border-gray-600 ml-4"
            >
              <ArrowLeft className="transition-transform duration-300 group-hover:scale-125 group-hover:-translate-x-0.5" size={45} />
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 🔥 CONTEÚDO PRINCIPAL - PROPORÇÃO DINÂMICA */}
          <div
            className={`transition-all duration-300 ${showAside && !isMobile
                ? 'lg:w-3/4 w-full'
                : 'w-full'
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
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
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
                  ${isMobile
                    ? 'fixed inset-y-0 right-0 w-4/5 max-w-sm z-50'
                    : showAside
                      ? 'lg:relative lg:w-1/4 lg:block'
                      : 'lg:hidden'
                  }
                `}
              >
                {/* 🔥 DIV FANTASMA PARA ALINHAR COM O TÍTULO DO VÍDEO */}
                <div className="hidden lg:block h-[72px] mb-4"></div>

                <div className={`bg-gray-800 rounded-xl overflow-hidden ${isMobile ? 'h-full' : ''}`}>
                  {/* HEADER DO ASIDE */}
                  <div className="flex justify-between items-center px-6 py-6 relative">
                    {/* BOTÃO FECHAR - MOBILE */}
                    {isMobile && (
                      <button
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-transform duration-300 hover:scale-110"
                        onClick={() => setShowAside(false)}
                      >
                        <X size={20} />
                      </button>
                    )}

                    {/* BOTÃO FECHAR - DESKTOP */}
                    {!isMobile && (
                      <button
                        className="py-2 pl-1 overflow-x-hidden cursor-pointer absolute bg-[#303745] top-0 left-0 hover:bg-[#404855] transition-all duration-300 hover:scale-105"
                        onClick={() => setShowAside(false)}
                      >
                        <ArrowRight size={45} />
                      </button>
                    )}

                    <motion.h4
                      className="font-semibold text-lg pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      Aulas
                    </motion.h4>
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <h4 className="font-semibold text-lg">{contents.length} aulas</h4>
                    </motion.div>
                  </div>

                  {/* LISTA DE AULAS COM ANIMAÇÃO ESCALONADA */}
                  <div className={`overflow-x-hidden overflow-y-auto ${isMobile ? 'h-[calc(100%-200px)]' : 'max-h-[415px]'}`}>
                    <AnimatePresence>
                      {contents.map((lesson, index) => {
                        console.log(lesson)
                        const totalSeconds = lesson.duration_in_seconds || 0;
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;


                        const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
                          .toString()
                          .padStart(2, "0")}`;
                        const isActive = currentContentId === lesson.id;

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
                              flex my-1 text-4xl items-center gap-3 p-3 rounded cursor-pointer 
                              hover:bg-gray-700 transition-colors duration-200
                              ${isActive ? 'bg-gray-700' : 'text-gray-400'}
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <button className="size-3.5 rounded-[3px] border border-green-500 flex items-center justify-center hover:opacity-80 transition-all disabled:cursor-not-allowed"
                              disabled
                            ></button>
                            <div className="flex-1 flex flex-row items-center overflow-hidden gap-1.5 font-bold">
                              {lesson.content_type === "aula" ? (
                                <Play size={16} className="shrink-0" />
                              ) : (
                                <List size={16} className="shrink-0" />
                              )}
                              <span className="truncate text-lg whitespace-nowrap">{lesson.title}</span>
                            </div>
                            <div className="flex flex-row items-center gap-1.5 text-lg text-gray-400 font-mono font-bold">
                              <span>{formattedTime}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* BARRA DE PROGRESSO COM ANIMAÇÃO */}
                  <motion.div
                    className="w-full p-4 border-t border-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">{currentLink?.module_name || moduloSlug}</h3>
                      <span>0/{contents.length}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-2 bg-blue-600 rounded-full w-0"></div>
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