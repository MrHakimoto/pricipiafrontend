// components/ModuloAside.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, List, ChevronRight } from "lucide-react";
import { useModuloStore } from "@/store/useModuloStore";

interface ModuloAsideProps {
  currentData: any;
  moduloId: string;
  moduloSlug: string;
  onLessonClick: (lesson: any) => void;
}

export function ModuloAside({ currentData, moduloId, moduloSlug, onLessonClick }: ModuloAsideProps) {
  const { contents, showAside, setShowAside, currentLink } = useModuloStore();

  if (!showAside) return null;

  // Função para formatar o tempo
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, width: 0 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        width: '25%'
      }}
      exit={{ 
        opacity: 0, 
        x: 20, 
        width: 0,
        transition: { duration: 0.2 }
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }}
      className="flex-shrink-0 pl-6"
    >
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-6 relative">
          <button 
            className="py-2 pl-1 cursor-pointer absolute bg-[#303745] top-0 left-0 hover:bg-[#404855] transition-all duration-300 hover:scale-105"
            onClick={() => setShowAside(false)}
          >
            <ChevronRight size={45} />
          </button>
          <h4 className="font-semibold text-lg pl-8">Aulas</h4>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{contents.length} aulas</h4>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAside(false)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600"
            >
              <ChevronRight size={16} />
            </motion.button>
          </div>
        </div>
        <div className="overflow-auto max-h-[415px]">
          {contents.map((lesson, index) => {
            // ✅ CORREÇÃO: Use duration_in_seconds em vez de estimated_time_minutes
            const totalSeconds = lesson.duration_in_seconds || 0;
            const formattedTime = formatTime(totalSeconds);

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => onLessonClick(lesson)}
                className={`flex my-1 text-4xl items-center gap-3 p-3 rounded cursor-pointer hover:bg-gray-700 ${
                  currentData?.id === lesson.id ? 'bg-gray-700' : 'text-gray-400'
                }`}
              >
                <button
                  className="size-3.5 rounded-[3px] border border-green-500 flex items-center justify-center hover:opacity-80 hover:scale-110 transition-all disabled:cursor-not-allowed"
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
            )
          })}
        </div>
      </div>
      
      {/* BARRA DE PROGRESSO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full mt-3"
      >
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold">{currentLink?.module_name || moduloSlug}</h3>
          <span>0/{contents.length}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full">
          <div className="h-2 bg-blue-600 rounded-full w-0"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}