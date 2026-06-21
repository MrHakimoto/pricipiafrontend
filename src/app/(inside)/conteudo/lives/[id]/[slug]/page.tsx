"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Play, Heart } from "lucide-react";

import type { Variants } from "framer-motion";

import { slugify } from "@/lib/slug";
import { api } from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import PdfViewerModal from "@/components/modules/PdfViewerModal";
import { DuvidaCard } from "@/components/modules/DuvidaCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
// import CommentSection from "@/components/modules/CommentSection"; // se for usar, descomente

type LiveFull = {
  id: number;
  title: string;
  description: string | null;
  duration: number | null;
  thumb: string | null;
  panda_live_id: string;
  status: string;

  player_embed_url: string | null;
  hls_url: string | null;

  recorded_video_id: string | null;
  recorded_embed_url: string | null;

  starts_at: string | null;
  ends_at: string | null;

  chat?: string | null;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/85 ring-1 ring-white/10">
      {children}
    </span>
  );
}

function ChatEmbed({ src }: { src: string }) {
  return (
    <div className="relative w-full h-full">
      <iframe
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function LiveViewPage() {
  const router = useRouter();
  const params = useParams<{ id: string; slug: string }>();
  const { data: session, status } = useSession();

  const [live, setLive] = useState<LiveFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI state
  const [showAside, setShowAside] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // No mobile: apenas "detalhes"
  const [activeTab, setActiveTab] = useState<"detalhes" | "duvidas">("detalhes");

  const [selectedPdf, setSelectedPdf] = useState<{
    url: string;
    fileName: string;
    files?: { file_url: string; file_name: string }[];
  } | null>(null);

   useDocumentTitle("Live");

  const token = (session as any)?.laravelToken as string | undefined;
  const id = params?.id;

  const asideVariants: Variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { type: "tween", duration: 0.4, ease: "easeOut" } as const,
  },
  closed: {
    x: "100%",
    opacity: 0,
    transition: { type: "tween", duration: 0.4, ease: "easeIn" } as const,
  },
};

const overlayVariants: Variants = {
  open: { opacity: 1, transition: { duration: 0.3 } },
  closed: { opacity: 0, transition: { duration: 0.3 } },
};

const itemVariants: Variants = {
  open: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
  closed: {
    x: 20,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Se for mobile, forçar aba detalhes
  useEffect(() => {
    if (isMobile) setActiveTab("detalhes");
  }, [isMobile]);

  // Buscar dados da live
  useEffect(() => {
    if (status === "loading") return;

    if (!token) {
      setLoading(false);
      setErrorMsg("Sessão não encontrada.");
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await api.get(`/lives/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data as LiveFull;

        if (cancelled) return;
        setLive(data);

        // Redirecionar para slug canônico se necessário
        const canonical = slugify(data.title);
        const currentSlug = params?.slug || "";
        if (canonical && currentSlug !== canonical) {
          router.replace(`/conteudo/lives/${data.id}/${canonical}`);
        }
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e.message || "Erro ao carregar live.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();


    return () => {
      cancelled = true;
    };
  }, [token, status, id, params?.slug, router]);

  useEffect(() => {
  if (isMobile) {
    setShowAside(false);
  }
}, [isMobile]);

  // URL do player
  const playerUrl = useMemo(() => {
    if (!live) return null;
    if (["scheduled", "ready", "live"].includes(live.status) && live.player_embed_url) {
      return live.player_embed_url;
    }
    if (live.recorded_embed_url) return live.recorded_embed_url;
    return null;
  }, [live]);

  // URL do chat (live_chat.html)
  const chatUrl = useMemo(() => {
    if (!live?.chat) return null;
    return live.chat;
  }, [live]);

  // Placeholder para itens do aside
  const asideItems = useMemo(() => {
    return live ? [{ id: live.id, title: live.title, duration: live.duration }] : [];
  }, [live]);

  const formatTime = (totalSeconds: number | null) => {
    if (!totalSeconds) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Animações




  const handleOpenPdf = (pdfUrl: string, fileName: string) => {
    setSelectedPdf({ url: pdfUrl, fileName, files: [{ file_url: pdfUrl, file_name: fileName }] });
  };

  // Loading
  if (loading) {
    return (
      <div className="bg-[#00091A] text-white min-h-dvh px-6 py-10">
        <Skeleton className="h-8 w-3/4 bg-gray-700" />
        <Skeleton className="w-full aspect-video mt-4 bg-gray-700" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-10 flex-1 bg-gray-700" />
          <Skeleton className="h-10 flex-1 bg-gray-700" />
        </div>
      </div>
    );
  }

  // Erro
  if (errorMsg || !live) {
    return (
      <div className="bg-[#00091A] text-white min-h-dvh px-6 py-10">
        <p className="text-red-200">{errorMsg || "Live não encontrada."}</p>
        <Link href="/conteudo/lives" className="text-blue-400 hover:text-blue-300 mt-4 block">
          ← Voltar para Lives
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#00091A] text-white flex flex-col overflow-hidden">
      {/* Botão fixo para abrir aside no mobile */}
      {/* {!showAside && isMobile && (
        <button
          onClick={() => setShowAside(true)}
          className="cursor-pointer fixed right-4 top-1/2 transform -translate-y-1/2 z-40 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg border border-gray-600 transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft size={20} />
        </button>
      )} */}

      <div className="lg:px-6 px-1 outfit w-full">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => router.back()}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-800 hover:opacity-80"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Link
                href="/conteudo/lives"
                className="hover:text-white transition-colors duration-200 font-medium px-3 py-1 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
              >
                Lives
              </Link>
              <ChevronRight size={14} className="text-gray-500" />
              <span className="text-white font-semibold px-3 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm">
                {live.title}
              </span>
            </div>
          </div>

          {/* Botão para abrir aside no desktop */}
          {!isMobile && !showAside && (
            <button
              onClick={() => setShowAside(true)}
              className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110 group border border-gray-600 ml-4"
            >
              <ChevronLeft
                className="transition-transform duration-300 group-hover:scale-125 group-hover:-translate-x-0.5"
                size={45}
              />
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 pb-50">
          {/* CONTEÚDO PRINCIPAL */}
          <div
            className={`transition-all duration-300 ${
              showAside && !isMobile ? "lg:w-3/4 w-full" : "w-full"
            }`}
          >
            {/* TÍTULO + BADGES */}
            <div className="mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-white text-2xl font-semibold outfit">{live.title}</h2>
                {/* <Badge>Status: {live.status}</Badge> */}
                {live.duration && <Badge>Duração: {formatTime(live.duration)}</Badge>}
                {live.starts_at && <Badge>Início: {new Date(live.starts_at).toLocaleString("pt-BR")}</Badge>}
              </div>
            </div>

            {/* PLAYER */}
            <div className="mb-6 relative">
              {!playerUrl ? (
                <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-white/60">Player indisponível no momento</p>
                </div>
              ) : (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={playerUrl}
                    className="absolute inset-0 h-full w-full rounded-lg border-0"
                    allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* BOTÕES (estrutura) */}
            <div className="w-full mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap sm:flex-nowrap sm:justify-between gap-2 sm:gap-4">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  <button className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition text-sm sm:text-base">
                    <Heart size={16} />
                    Curtir Live
                  </button>
                  <button className="cursor-pointer flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition text-sm sm:text-base">
                    <Heart size={16} />
                    Favoritar
                  </button>

                  {false && (
                    <button
                      onClick={() => handleOpenPdf("#", "material.pdf")}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700/30 transition text-sm sm:text-base"
                    >
                      Anexo (0)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                  <button
                    onClick={() => router.back()}
                    className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition text-sm sm:text-base"
                  >
                    <ChevronLeft size={16} />
                    Voltar
                  </button>
                </div>
              </div>
            </div>

            {/* ABAS */}
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

                {/* Dúvidas: somente desktop */}
                {/* {!isMobile && (
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
                )} */}
              </div>

              <div className="bg-[#1f1f23] border border-gray-800 mt-2 p-4 rounded-sm text-sm text-gray-300 max-w-6xl">
                {activeTab === "detalhes" ? (
                  <div className="space-y-4">
                    {live.description && <p className="text-white font-semibold mb-3">{live.description}</p>}

                    

                    {/* CHAT: apenas no MOBILE, “lá embaixo”, junto do Detalhes */}
                    {isMobile && chatUrl && (
                      <div className="pt-4 border-t border-gray-700">
                        <h4 className="text-white font-semibold mb-3">Chat ao vivo</h4>
                        <div className="relative w-full h-[420px] rounded-lg overflow-hidden border border-gray-700 bg-black/20">
                          <ChatEmbed src={chatUrl} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Dúvidas: apenas desktop (pois no mobile o botão sequer aparece)
                  <DuvidaCard courseContentId={live.id} enunciado={live.title} />
                )}
              </div>

              {/* SEÇÃO DE COMENTÁRIOS (se quiser, reative)
              <div className="mt-6 max-w-6xl">
                <CommentSection contentId={live.id} contentType="live" />
              </div>
              */}
            </div>
          </div>

          {/* OVERLAY MOBILE */}
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

          {/* ASIDE */}
          <AnimatePresence>
            {(showAside || !isMobile) && (
              <motion.div
                key="aside"
                variants={asideVariants}
                initial={isMobile ? "closed" : false}
                animate={showAside ? "open" : "closed"}
                exit="closed"
                className={`${
                  isMobile
                    ? "fixed inset-y-0 right-0 w-4/5 max-w-sm z-50"
                    : showAside
                    ? "lg:relative lg:w-1/4 lg:block"
                    : "lg:hidden"
                }`}
              >
                {/* Div fantasma para alinhamento desktop */}
                <div className="hidden lg:block h-[72px] mb-4"></div>

                <div className={`bg-gray-800 rounded-xl overflow-hidden ${isMobile ? "h-full" : ""}`}>
                  {/* Header do aside */}
                  <div className="flex justify-between items-center px-6 py-6 relative">
                    {/* Fechar mobile */}
                    {isMobile && (
                      <button
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-transform duration-300 hover:scale-110"
                        onClick={() => setShowAside(false)}
                      >
                        <X size={20} />
                      </button>
                    )}

                    {/* Fechar desktop */}
                    {!isMobile && (
                      <button
                        className="py-2 pl-1 overflow-x-hidden cursor-pointer absolute bg-[#303745] top-0 left-0 hover:bg-[#404855] transition-all duration-300 hover:scale-105"
                        onClick={() => setShowAside(false)}
                      >
                        <ChevronRight size={45} />
                      </button>
                    )}

                    <motion.h4
                      className="font-semibold text-lg pl-8"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      
                    </motion.h4>

                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <h4 className="font-semibold text-lg"> Principia Matemática</h4>
                    </motion.div>
                  </div>

                  {/* DESKTOP: CHAT dentro do ASIDE (substitui lista/rodapé) */}
                  {!isMobile && (
                    <div className="p-4 h-[520px]">
                      {!chatUrl ? (
                        <div className="h-full rounded-lg border border-gray-700 bg-black/20 flex items-center justify-center">
                          <p className="text-white/60 text-sm">Chat indisponível</p>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg overflow-hidden border border-gray-700 bg-black/20">
                          <ChatEmbed src={chatUrl} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* MOBILE: mantém a lista como estava (sem chat no aside) */}
                  {isMobile && (
                    <>
                      <div className="overflow-x-hidden overflow-y-auto h-[calc(100%-200px)]">
                        <AnimatePresence>
                          {asideItems.map((item, index) => (
                            <motion.div
                              key={item.id}
                              custom={index}
                              variants={itemVariants}
                              initial="closed"
                              animate="open"
                              exit="closed"
                              className="flex my-1 text-base items-center gap-3 p-3 rounded cursor-pointer hover:bg-gray-700 transition-colors duration-200 text-gray-400"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Play size={16} className="shrink-0" />
                              <div className="flex-1 truncate text-base font-bold">{item.title}</div>
                              <div className="text-base text-gray-400 font-mono font-bold">
                                {formatTime(item.duration)}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      <motion.div
                        className="w-full p-4 border-t border-gray-700"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="flex justify-between mb-2">
                          <h3 className="font-semibold">Próximas lives</h3>
                          <span className="text-blue-400">0/0</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: "0%" }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                          <span>Nenhuma live futura</span>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL PDF */}
      {selectedPdf && (
        <PdfViewerModal
          onClose={() => setSelectedPdf(null)}
          files={selectedPdf.files || [{ file_url: selectedPdf.url, file_name: selectedPdf.fileName }]}
        />
      )}
    </div>
  );
}