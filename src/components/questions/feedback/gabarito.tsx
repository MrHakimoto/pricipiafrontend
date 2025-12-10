// components/questions/feedback/gabarito.tsx
"use client";

import { useState, useEffect, useCallback  } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processMarkdown } from "@/utils/markdownProcessor";
import { AlertCircle, FileText, Video } from "lucide-react";
import { ImageLightbox } from "@/components/editor/ImageLightbox";

interface GabaritoQuestaoProps {
  questaoId?: number;
  gabaritoVideo?: string;
  gabaritoComentado?: string;
}

export const GabaritoQuestao: React.FC<GabaritoQuestaoProps> = ({ 
  questaoId,
  gabaritoVideo = "",
  gabaritoComentado = ""
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'texto'>('texto');
  const [processedText, setProcessedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [hasText, setHasText] = useState<boolean>(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Verificar quais conteúdos estão disponíveis

  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Verificar se o clique foi em uma imagem
      if (target.tagName === 'IMG') {
        // Verificar se NÃO está em um menu do usuário, notificações, ou nav
        const isInUserMenu = target.closest('[class*="UserMenu"]') || 
                            target.closest('[class*="user-menu"]') ||
                            target.closest('[class*="notification"]') ||
                            target.closest('nav') ||
                            target.closest('button') ||
                            target.closest('[role="menu"]') ||
                            target.closest('[role="dialog"]');
        
        // Verificar se está no conteúdo do gabarito
        const isInGabaritoContent = target.closest('.markdown-body') || 
                                   target.closest('[class*="gabarito"]') ||
                                   target.closest('[class*="explicacao"]');
        
        // Só abrir lightbox se estiver no conteúdo do gabarito e NÃO em um menu
        if (isInGabaritoContent && !isInUserMenu) {
          const src = target.getAttribute('src');
          if (src) {
            setZoomedImageUrl(src);
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    }

    // Usar capture: true para pegar o evento antes dos menus
    document.addEventListener('click', handleImageClick, true);

    return () => {
      document.removeEventListener('click', handleImageClick, true);
    };
  }, []);

  useEffect(() => {
     const videoAvailable = Boolean(gabaritoVideo && gabaritoVideo.trim() !== "");
  const textAvailable = Boolean(gabaritoComentado && gabaritoComentado.trim() !== "");
    
    setHasVideo(videoAvailable);
    setHasText(textAvailable);
    
    // Definir tab ativa padrão baseado no que está disponível
    if (videoAvailable) {
      setActiveTab('video');
    } else if (textAvailable) {
      setActiveTab('texto');
    }
  }, [gabaritoVideo, gabaritoComentado]);

  // Processar markdown do gabarito de texto
  useEffect(() => {
    if (gabaritoComentado && gabaritoComentado.trim() !== "") {
      setIsProcessing(true);
      processMarkdown(gabaritoComentado)
        .then(processed => {
          setProcessedText(processed);
          setIsProcessing(false);
        })
        .catch(error => {
          console.error("Erro ao processar markdown do gabarito:", error);
          setProcessedText(gabaritoComentado);
          setIsProcessing(false);
        });
    } else {
      setIsProcessing(false);
      setProcessedText("");
    }
  }, [gabaritoComentado]);

   const closeLightbox = useCallback(() => {
    setZoomedImageUrl(null);
  }, []);

  // Se não houver nenhum conteúdo
  if (!hasVideo && !hasText) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-6"
      >
        <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-yellow-900/20 rounded-full border border-yellow-700">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold mb-2">
                  Gabarito não disponível
                </h3>
                <p className="text-gray-400">
                  Esta questão ainda não possui gabarito comentado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex justify-center my-6"
    >
      <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 overflow-hidden">

        {/* Aba superior - condicional */}
        <div className="flex border-b border-gray-700 text-sm font-medium">
          {hasVideo && (
            <button 
              onClick={() => setActiveTab('video')}
              className={`cursor-pointer px-6 py-3 transition-colors flex items-center gap-2 ${
                activeTab === 'video' 
                  ? 'text-white bg-[#131b2d] border-b-2 border-pink-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              Vídeo
            </button>
          )}
          
          {hasText && (
            <button 
              onClick={() => setActiveTab('texto')}
              className={`cursor-pointer px-6 py-3 transition-colors flex items-center gap-2 ${
                activeTab === 'texto' 
                  ? 'text-white bg-[#131b2d] border-b-2 border-pink-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Texto
            </button>
          )}
        </div>

        {/* Conteúdo das Abas */}
        <AnimatePresence mode="wait">
          {activeTab === 'video' && hasVideo && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="aspect-video relative">
                <iframe
                  width="100%"
                  height="100%"
                  src={gabaritoVideo}
                  title={`Gabarito Questão ${questaoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              
              {/* Legenda informativa */}
              <div className="p-4 bg-blue-900/20 border-t border-blue-700/30">
                <p className="text-blue-300 text-sm text-center">
                  Assista ao vídeo para entender a resolução completa desta questão.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'texto' && (
            <motion.div
              key="texto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {isProcessing ? (
                // Skeleton durante o processamento
                <div className="animate-pulse">
                  <div className="bg-[#131b2d] rounded-lg p-6 border border-gray-700">
                    <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ) : hasText ? (
                // Gabarito processado com markdown
                <div className="bg-[#131b2d] rounded-lg p-6 border border-gray-700">
                  <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Explicação Detalhada
                  </h3>
                  <div
                    className="text-gray-300 leading-relaxed markdown-body wmde-markdown wmde-markdown-color"
                    style={{
                      '--color-canvas-default': 'transparent',
                      '--color-fg-default': 'currentColor'
                    } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: processedText }}
                  />
                  
                  {/* Dica extra */}
                  <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                    <div className="flex items-center gap-2 text-blue-300 font-semibold mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Dica Importante
                    </div>
                    <p className="text-blue-200 text-sm">
                      Lembre-se, antes falhar do que ser um fracassado!
                    </p>
                  </div>
                </div>
              ) : (
                // Mensagem quando não há gabarito de texto (mas há vídeo)
                <div className="bg-[#131b2d] rounded-lg p-8 border border-gray-700 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-3 bg-yellow-900/20 rounded-full border border-yellow-700">
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Gabarito em texto não disponível
                      </h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Esta questão não possui explicação escrita.
                      </p>
                      {hasVideo && (
                        <button
                          onClick={() => setActiveTab('video')}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <span className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Ver vídeo explicativo
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
       {zoomedImageUrl && (
        <ImageLightbox
          imageUrl={zoomedImageUrl}
          onClose={closeLightbox}
        />
      )}
    </motion.div>
  );
};