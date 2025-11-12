//modulos/[moduloId]/[moduloSlug]/[conteudoId]/[conteudoSlug]/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Heart, Link2, CheckCircle, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useModuloStore } from "@/store/useModuloStore";
import ListaCursePage from "@/components/questions/CurseList";

export default function ConteudoPage() {
  const router = useRouter();
  const params = useParams();
  const { moduloId, moduloSlug, conteudoId } = params as {
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
    loadedModuloId, // <- Chave para a lógica
    setContents,
    setLoadedModuloId,
    setInitialLoading,
    initialLoading
  } = useModuloStore();
  

  const [videoLoading, setVideoLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"detalhes" | "duvidas">("detalhes");
  const [isMobile, setIsMobile] = useState(false);

  // 🔥 DETECTAR SE É MOBILE
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔥 ENCONTRA O CONTEÚDO ATUAL
  const thisDataD = contents.find((c) => c.id === Number(conteudoId));
  const currentIndex = contents.findIndex((c) => c.id === Number(conteudoId));

  // 🔥 ATUALIZA O STORE QUANDO O CONTEÚDO MUDA
  useEffect(() => {
    if (thisDataD) {
      setCurrentContentId(Number(conteudoId));
      setCurrentContentType(thisDataD.content_type);
    }
  }, [conteudoId, thisDataD, setCurrentContentId, setCurrentContentType]);

  // 🔥 RESETA LOADING DO VÍDEO QUANDO MUDA
  useEffect(() => {
    setVideoLoading(true);
  }, [conteudoId]);

  // 🔥 NAVEGAÇÃO SIMPLES
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
  };

  const handlePreviousLesson = () => {
    if (currentIndex > 0) {
      const prevLesson = contents[currentIndex - 1];
      goToLesson(prevLesson);
    }
  };

  const handleNextLesson = () => {
    if (currentIndex < contents.length - 1) {
      const nextLesson = contents[currentIndex + 1];
      goToLesson(nextLesson);
    }
  };

  // 🔥 LOADING
  if (!thisDataD) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 bg-gray-700" />
        <Skeleton className="w-full aspect-video bg-gray-700" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 bg-gray-700" />
          <Skeleton className="h-10 flex-1 bg-gray-700" />
          <Skeleton className="h-10 flex-1 bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 🔥 BOTÃO ABRIR ASIDE NO MOBILE - SÓ MOSTRA QUANDO ASIDE ESTÁ FECHADO */}
      {isMobile && !showAside && (
        <button
          onClick={() => setShowAside(true)}
          className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
        >
          <Menu size={18} />
          Ver Aulas
        </button>
      )}

      {/* TÍTULO */}
      <div className="mb-4">
        <h2 className="text-white text-2xl font-semibold outfit">
          {thisDataD.title}
        </h2>
      </div>

      {/* CONTEÚDO DINÂMICO */}
      {currentContentType === "aula" ? (
        // 🔥 CONTEÚDO DE AULA
        <div>
          {/* PLAYER DE VÍDEO COM PROPORÇÃO 4/3 */}
          <div className="mb-6">
            {videoLoading && <Skeleton className="w-full aspect-video" />}
            {thisDataD.content_url && (
              <div className="w-full bg-black rounded-lg flex items-center justify-center aspect-video"
              style={{ height: '600px' }}
              > {/* 🔥 PROPORÇÃO 4/3 */}
                <iframe
                  src={thisDataD.content_url}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; autoplay"
                  allowFullScreen
                  className="w-full h-full border-0 rounded-lg"
                  onLoad={() => setVideoLoading(false)}
                />
              </div>
            )}
          </div>

          {/* BOTÕES DE NAVEGAÇÃO */}
          <div className="w-full mt-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="flex gap-4">
                <button className="cursor-pointer flex items-center gap-2 px-6 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition">
                  <Star size={18} />
                  Estrelas
                </button>
                <button className="cursor-pointer flex items-center gap-2 px-6 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition">
                  <Heart size={18} />
                  Favoritar
                </button>
                <button className="cursor-pointer flex items-center gap-2 px-6 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition">
                  <Link2 size={18} />
                  Anexo
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handlePreviousLesson}
                  disabled={currentIndex <= 0}
                  className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                  Aula anterior
                </button>
                <button className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition">
                  <CheckCircle size={18} />
                  Concluir aula
                </button>
                <button
                  onClick={handleNextLesson}
                  disabled={currentIndex >= contents.length - 1}
                  className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima aula
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* SEÇÃO DE COMENTÁRIOS */}
          <div className="mt-8">
            <div className="flex border-b border-gray-700 max-w-6xl">
              <button
                onClick={() => setActiveTab("detalhes")}
                className={`cursor-pointer px-4 py-2 text-2xl font-semibold transition ${
                  activeTab === "detalhes"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Detalhes
              </button>
              <button
                onClick={() => setActiveTab("duvidas")}
                className={`cursor-pointer px-4 py-2 text-2xl font-semibold transition ${
                  activeTab === "duvidas"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Dúvidas
              </button>
            </div>
            <div className="bg-[#1f1f23] border border-gray-800 mt-2 p-4 rounded-sm text-sm text-gray-300 max-w-6xl">
              {activeTab === "detalhes" ? (
                <p className="leading-relaxed">Detalhes da aula atual...</p>
              ) : (
                <p className="leading-relaxed">Dúvidas e discussões da aula.</p>
              )}
            </div>
            <form className="mt-8">
              <h3 className="text-white font-semibold mb-4 text-3xl mt-10">
                Digite aqui seu comentário
              </h3>
              <textarea
                placeholder="Digite aqui seu comentário"
                rows={5}
                className="w-full p-3 rounded-md bg-[#00091A] border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-6xl"
              />
              <div className="mt-4">
                <button
                  type="submit"
                  className="mt-3 ml-3 text-2xl bg-[#0E00D0] hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-md cursor-pointer"
                >
                  Publicar comentário
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // 🔥 CONTEÚDO DE LISTA
        <div>
          <ListaCursePage idList={thisDataD.list_id || 0} />
        </div>
      )}
    </div>
  );
}