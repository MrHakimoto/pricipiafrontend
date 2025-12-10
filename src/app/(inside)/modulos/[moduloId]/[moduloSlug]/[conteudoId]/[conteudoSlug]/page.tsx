"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Heart, Link2, ChevronLeft, ChevronRight, Menu, FileText } from "lucide-react";
import { useModuloStore } from "@/store/useModuloStore";
import { useSession } from "next-auth/react";
import ListaCursePage from "@/components/questions/CurseList";
import PdfViewerModal from "@/components/modules/PdfViewerModal";
import LessonCompletionToggle from "@/components/modules/LessonCompletionToggle";
import CommentCard from "@/components/modules/CommentCard";
import CommentSection from "@/components/modules/CommentSection";

import { useVideoProgress } from '@/hooks/useVideoProgress';
import { usePandaPlayer } from '@/hooks/usePandaPlayer';
import { DuvidaCard } from "@/components/modules/DuvidaCard";
import { toggleLike } from "@/lib/course/like";



interface FileItem {
  file_url: string;
  file_name: string;
}

interface SelectedPdf {
  url: string;
  fileName: string;
  files?: FileItem[];
}

export default function ConteudoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

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
    markLessonAsCompleted,
    markLessonAsUncompleted
  } = useModuloStore();

  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"detalhes" | "duvidas">("detalhes");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);

  // 🔥 ENCONTRA O CONTEÚDO ATUAL
  const thisDataD = contents.find((c) => c.id === Number(conteudoId));
  const currentIndex = contents.findIndex((c) => c.id === Number(conteudoId));

  const { sendHeartbeat, saveFinalProgress, isSaving } = useVideoProgress(Number(conteudoId));
  const { setupPlayerListeners, currentTimeRef } = usePandaPlayer(
    Number(conteudoId),
    thisDataD?.user_progress?.last_watched_timestamp
  );

  useEffect(() => {
    console.log('🎬 Iniciando configuração do player...');

    const cleanup = setupPlayerListeners();

    const handleBeforeUnload = () => {
      const finalTime = currentTimeRef.current;
      console.log('🚪 Usuário saindo - salvando tempo final:', finalTime);
      saveFinalProgress(finalTime);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('🔚 Desmontando componente...');
      cleanup();
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Save final na desmontagem
      const finalTime = currentTimeRef.current;
      if (finalTime > 5) { // Só salva se assistiu pelo menos 5 segundos
        console.log('💾 Salvando progresso final na desmontagem:', finalTime);
        saveFinalProgress(finalTime);
      }
    };
  }, [setupPlayerListeners]);

  // Ref para guardar o último tempo conhecido (fallback)
  const lastKnownTimeRef = useRef<number>(0);

  // 🔥 EFFECT PARA ATUALIZAR O LAST KNOWN TIME

  // 🔥 ATUALIZA O STORE QUANDO O CONTEÚDO MUDA
  useEffect(() => {
    if (thisDataD) {
      setCurrentContentId(Number(conteudoId));
      setCurrentContentType(thisDataD.content_type);
    }
  }, [conteudoId, thisDataD, setCurrentContentId, setCurrentContentType]);

  // 🔥 DETECTAR SE É MOBILE
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔥 SIMPLES: Controle de loading do vídeo
  useEffect(() => {
    if (thisDataD?.content_url) {
      console.log('🎬 URL do vídeo disponível:', thisDataD.content_url);

      // Pequeno delay para garantir renderização
      const timer = setTimeout(() => {
        setVideoLoading(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [thisDataD?.content_url]);

  // 🔥 HANDLE COMPLETION CHANGE
  const handleCompletionChange = (lessonId: number, completed: boolean) => {
    if (completed) {
      markLessonAsCompleted(lessonId);
    } else {
      markLessonAsUncompleted(lessonId);
    }
  };

  // 🔥 NAVEGAÇÃO ENTRE AULAS
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

  const handleOpenPdf = (pdfUrl: string, fileName: string) => {
    const files: FileItem[] = thisDataD?.attachments?.map(att => ({
      file_url: att.file_url,
      file_name: att.file_name
    })) || [{ file_url: pdfUrl, file_name: fileName }];

    setSelectedPdf({ url: pdfUrl, fileName, files });
  };

  // 🔥 LOADING - Se não tem dados ainda
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

  const attachmentsCount: number = thisDataD.attachments?.length || 0;
  const isCompleted = thisDataD.user_progress?.is_completed || false;
  const hasProgress = (thisDataD.user_progress?.last_watched_timestamp || 0) > 0;

  return (
    <div>
      {/* 🔥 BOTÃO ABRIR ASIDE NO MOBILE */}
      {isMobile && !showAside && (
        <button
          onClick={() => setShowAside(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
        >
          <Menu size={18} />
          Ver Aulas
        </button>
      )}

      {/* TÍTULO */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {!(isMobile && currentContentType !== "aula") && (
            <h2 className="text-white text-2xl font-semibold outfit">
              {thisDataD.title}
            </h2>
          )}
          {isCompleted && (
            <span className="text-sm bg-green-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
              Concluída
            </span>
          )}
          {hasProgress && !isCompleted && (
            <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded-full">
              Em andamento
            </span>
          )}
        </div>
        {/* {thisDataD.user_progress?.last_watched_timestamp && (
          <p className="text-gray-400 text-sm mt-1">
            Continuar de {Math.floor(thisDataD.user_progress.last_watched_timestamp / 60)}:
            {(thisDataD.user_progress.last_watched_timestamp % 60).toString().padStart(2, '0')}
          </p>
        )} */}
      </div>

      {/* CONTEÚDO DINÂMICO */}
      {currentContentType === "aula" ? (
        <div>
          {/* PLAYER DE VÍDEO SIMPLES */}
          <div className="mb-6 relative">
            {videoLoading && (
              <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white">Carregando vídeo...</p>
                </div>
              </div>
            )}

            {thisDataD?.content_url && (
              <div className="relative">
                <iframe
                  src={thisDataD.content_url}
                  className="w-full h-full rounded-lg border-0"
                  style={{
                    height: '600px',
                    display: videoLoading ? 'none' : 'block'
                  }}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => {
                    console.log('✅ Iframe carregado - Continuar Assistindo ativo');
                    setVideoLoading(false);
                  }}
                  onError={() => {
                    console.error('❌ Erro ao carregar iframe');
                    setVideoLoading(false);
                  }}
                />

                {/* Indicador de progresso sendo salvo */}
                {isSaving && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Salvando progresso...
                  </div>
                )}

                {/* Badge de "Continuar de..." */}
                {/* {thisDataD.user_progress?.last_watched_timestamp &&
                  thisDataD.user_progress.last_watched_timestamp > 10 && (
                    <div className="absolute top-4 left-4 bg-blue-600/90 text-white px-3 py-1 rounded-full text-sm">
                      ▶ Continuar de {Math.floor(thisDataD.user_progress.last_watched_timestamp / 60)}:
                      {(thisDataD.user_progress.last_watched_timestamp % 60).toString().padStart(2, '0')}
                    </div>
                  )} */}
              </div>
            )}
          </div>

          {/* BOTÕES DE NAVEGAÇÃO */}
          <div className="w-full mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap sm:flex-nowrap sm:justify-between gap-2 sm:gap-4">
              {/* 🔹 Botões de Like / Favoritar / Anexo */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <button
                  onClick={async () => {
                    if (!session?.laravelToken) return;
                    try {
                      const result = await toggleLike(session.laravelToken, {
                        entity_type: 'aula',
                        entity_id: Number(conteudoId),
                      });
                      console.log('Like da aula:', result);
                    } catch (error) {
                      console.error('Erro ao curtir aula:', error);
                    }
                  }}
                  className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition text-sm sm:text-base"
                >
                  <Heart size={16} />
                  Curtir Aula
                </button>

                <button className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition text-sm sm:text-base">
                  <Heart size={16} />
                  Favoritar
                </button>

                {attachmentsCount > 0 && (
                  <button
                    onClick={() =>
                      thisDataD.attachments &&
                      thisDataD.attachments.length > 0 &&
                      handleOpenPdf(
                        thisDataD.attachments[0].file_url,
                        thisDataD.attachments[0].file_name
                      )
                    }
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition text-sm sm:text-base"
                  >
                    <Link2 size={16} />
                    Anexo ({attachmentsCount})
                  </button>
                )}
              </div>

              {/* 🔹 Botões de Navegação / Toggle */}
              <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                <button
                  onClick={handlePreviousLesson}
                  disabled={currentIndex <= 0}
                  className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <ChevronLeft size={16} />
                  Aula anterior
                </button>

                <div className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-sm sm:text-base">
                  <LessonCompletionToggle
                    lessonId={thisDataD.id}
                    isCompleted={isCompleted}
                    onCompletionChange={handleCompletionChange}
                    size={30}
                  />
                  <span>{isCompleted ? 'Concluída' : 'Marcar como concluída'}</span>
                </div>

                <button
                  onClick={handleNextLesson}
                  disabled={currentIndex >= contents.length - 1}
                  className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Próxima aula
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 🔹 Indicador de progresso */}
            {hasProgress && !isCompleted && (
              <div className="text-blue-400 text-sm bg-blue-900/20 p-3 rounded-md">
                📚 Continue assistindo para concluir esta aula
              </div>
            )}
          </div>


          {/* SEÇÃO DE COMENTÁRIOS */}
          <div className="mt-8">
            <div className="flex border-b border-gray-700 max-w-6xl">
              {/* Mostrar "Detalhes" apenas se houver description */}
              {thisDataD.description && (
                <button
                  onClick={() => setActiveTab("detalhes")}
                  className={`cursor-pointer px-4 py-2 text-2xl font-semibold transition ${activeTab === "detalhes"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  Detalhes
                </button>
              )}

              {/* Sempre mostrar "Dúvidas" */}
              <button
                onClick={() => setActiveTab("duvidas")}
                className={`cursor-pointer px-4 py-2 text-2xl font-semibold transition ${activeTab === "duvidas"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                Dúvidas
              </button>
            </div>

            <div className="bg-[#1f1f23] border border-gray-800 mt-2 p-4 rounded-sm text-sm text-gray-300 max-w-6xl">
              {activeTab === "detalhes" && thisDataD.description ? (
                <div className="space-y-4">
                  <p className="leading-relaxed">{thisDataD.description}</p>

                  {attachmentsCount > 0 && (
                    <div className="pt-4 border-t border-gray-700">
                      <h4 className="text-white font-semibold mb-3">
                        Arquivos da Aula ({attachmentsCount})
                      </h4>
                      <div className="space-y-2">
                        {thisDataD.attachments?.map((attachment, index) => (
                          <div
                            key={attachment.id || index}
                            className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-md"
                          >
                            <FileText size={20} className="text-blue-400" />
                            <div className="flex-1">
                              <p className="text-white text-sm">{attachment.file_name}</p>
                            </div>
                            <button
                              onClick={() =>
                                handleOpenPdf(attachment.file_url, attachment.file_name)
                              }
                              className="cursor-pointer text-blue-400 hover:text-blue-300 transition text-sm"
                            >
                              Visualizar
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
                  enunciado={thisDataD.title} // sempre mostra o Dúvidas
                />
              )}
            </div>


            <section className="mt-8">

              <section className="mt-8 max-w-6xl">
                <h3 className="text-white font-semibold mb-6 text-2xl max-w-6xl">
                  Comentários e Discussões
                </h3>

                <CommentSection courseContentId={Number(conteudoId)} />
              </section>

            </section>
          </div>
        </div>
      ) : (
        <div>
          <ListaCursePage idList={thisDataD.list_id || 0} />
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE PDF */}
      {selectedPdf && (
        <PdfViewerModal
          onClose={() => setSelectedPdf(null)}
          files={selectedPdf.files || [{ file_url: selectedPdf.url, file_name: selectedPdf.fileName }]}
        />
      )}
    </div>
  );
}