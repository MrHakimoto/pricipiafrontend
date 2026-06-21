"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  gerarSimuladoDaProva,
  getAvailableExams,
  getEditionsByExam,
  ProvaEdition,
  ProvaGroup,
  baixarPdfDaLista,
} from "@/lib/questions/provasFamosas";

type ProvaGroupWithCover = ProvaGroup & {
  cover_for_display?: string | null;
};

type CreatedSimuladoPayload = {
  listId: number;
  time: number;
  questionCount: number;
  title: string;
};

const XIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const QuestionIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const dropIn: Variants = {
  hidden: { y: -500, opacity: 0, scale: 0.8 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    y: 500,
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      type: "spring",
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const formatTime = (minutes: number): string => {
  const safeMinutes = Math.max(1, Number(minutes) || 1);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}min`;
};

const generateTimeOptions = (baseTime: number) => {
  const safeBaseTime = Math.max(1, Number(baseTime) || 1);
  const timeMinus10 = Math.max(1, Math.round(safeBaseTime * 0.9));
  const timePlus10 = Math.max(1, Math.round(safeBaseTime * 1.1));

  return [
    {
      value: timeMinus10.toString(),
      label: formatTime(timeMinus10),
    },
    {
      value: safeBaseTime.toString(),
      label: `${formatTime(safeBaseTime)} (recomendado)`,
    },
    {
      value: timePlus10.toString(),
      label: formatTime(timePlus10),
    },
  ];
};

const getProvaCoverUrl = (prova: ProvaGroupWithCover): string | null => {
  return (
    prova.cover_for_display ||
    prova.cover_image_url ||
    prova.logo_dark_url ||
    prova.logo_url ||
    prova.logo_light_url ||
    null
  );
};

interface SimuladoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  provaSelecionada: ProvaGroup | null;
  edicoes: ProvaEdition[];
  onCreatedSimulado: (payload: CreatedSimuladoPayload) => void;
  onNotify: (message: string, type?: "info" | "error" | "success") => void;
}

const SimuladoConfigModal = ({
  isOpen,
  onClose,
  provaSelecionada,
  edicoes,
  onCreatedSimulado,
  onNotify,
}: SimuladoConfigModalProps) => {
  const { data: session, status } = useSession();

  const token = session?.laravelToken;

  const [selectedEdition, setSelectedEdition] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const edicaoSelecionada = edicoes.find(
    (edicao) => edicao.id.toString() === selectedEdition,
  );

  const timeOptions = useMemo(() => {
    if (!edicaoSelecionada) return [];

    return [
      {
        value: "",
        label: "Selecione o tempo",
      },
      ...generateTimeOptions(edicaoSelecionada.tempo_total),
    ];
  }, [edicaoSelecionada]);

  useEffect(() => {
    if (isOpen) {
      setSelectedEdition("");
      setSelectedTime("");
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedTime("");
  }, [selectedEdition]);

  const handleStartSimulado = async () => {
    if (isLoading || !selectedEdition || !selectedTime) return;

    if (status !== "authenticated" || !token) {
      onNotify("Sessão inválida. Faça login novamente.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const resultado = await gerarSimuladoDaProva(
        token,
        selectedEdition,
        selectedTime,
      );

      const newListId = resultado?.lista_id;

      if (!newListId) {
        throw new Error("A API não retornou lista_id do simulado.");
      }

      onCreatedSimulado({
        listId: newListId,
        time: Number(selectedTime),
        questionCount: edicaoSelecionada?.total_questoes ?? 0,
        title:
          `${provaSelecionada?.sigla || provaSelecionada?.nome || "Prova"} ${
            edicaoSelecionada?.ano ?? ""
          }`.trim(),
      });

      onClose();
    } catch (error) {
      console.error("Erro ao criar simulado:", error);
      onNotify("Erro ao preparar a prova. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigValid = selectedEdition !== "" && selectedTime !== "";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="mx-auto w-full max-w-md rounded-lg border border-slate-700/80 bg-[#121620] text-gray-100 shadow-2xl"
      >
        <div className="relative border-b border-slate-700/50 p-6 pb-2">
          <h2 className="text-xl font-normal text-gray-100">
            {provaSelecionada?.nome || "Questões"}
          </h2>

          <p className="mt-1 text-sm font-light text-gray-400">
            Escolha a edição e o tempo de resolução
          </p>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 transition duration-150 hover:text-white"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-lg font-normal text-gray-100">
              Qual edição
            </label>

            <select
              value={selectedEdition}
              onChange={(event) => setSelectedEdition(event.target.value)}
              className="h-12 w-full cursor-pointer appearance-none rounded-md border border-[#434A56] bg-[#191D28] px-4 py-3 text-base text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0E00D0]"
            >
              <option value="" disabled>
                Selecione a edição
              </option>

              {edicoes.map((edicao) => (
                <option
                  key={edicao.id}
                  value={edicao.id}
                  className="bg-slate-900 text-gray-300"
                >
                  {edicao.ano ?? "Sem ano"} - {edicao.total_questoes} questão
                  {edicao.total_questoes !== 1 ? "es" : ""}
                  {edicao.descricao ? ` - ${edicao.descricao}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedEdition && (
            <div>
              <label className="mb-2 block text-lg font-normal text-gray-100">
                Tempo para a resolução
              </label>

              <select
                value={selectedTime}
                onChange={(event) => setSelectedTime(event.target.value)}
                className="h-12 w-full cursor-pointer appearance-none rounded-md border border-[#434A56] bg-[#191D28] px-4 py-3 text-base text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0E00D0]"
              >
                {timeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.value === ""}
                    className="bg-slate-900 text-gray-300"
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              {edicaoSelecionada && (
                <p className="mt-2 text-sm text-gray-400">
                  Tempo original da prova:{" "}
                  <span className="font-medium text-blue-400">
                    {formatTime(edicaoSelecionada.tempo_total)}
                  </span>
                </p>
              )}
            </div>
          )}

          {edicaoSelecionada && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="mb-2 flex items-center font-medium text-gray-100">
                <QuestionIcon className="mr-2 h-4 w-4 text-green-400" />
                Detalhes da Edição {edicaoSelecionada.ano ?? ""}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-300">
                  <BookIcon className="mr-2 h-4 w-4 text-blue-400" />
                  {edicaoSelecionada.total_questoes} questão
                  {edicaoSelecionada.total_questoes !== 1 ? "es" : ""}
                </div>

                <div className="flex items-center text-gray-300">
                  <ClockIcon className="mr-2 h-4 w-4 text-orange-400" />
                  {formatTime(edicaoSelecionada.tempo_total)}
                </div>
              </div>

              {edicaoSelecionada.banca && (
                <p className="mt-3 text-sm text-gray-400">
                  Banca:{" "}
                  <span className="text-gray-200">
                    {edicaoSelecionada.banca.sigla ||
                      edicaoSelecionada.banca.nome}
                  </span>
                </p>
              )}
            </div>
          )}

          <p className="pt-2 text-sm font-normal text-yellow-500">
            *Você irá resolver um simulado. Prepare-se como se estivesse no dia
            da prova.
          </p>

          <div className="pt-4">
            <motion.button
              type="button"
              onClick={handleStartSimulado}
              disabled={!isConfigValid || isLoading}
              className={`flex h-12 w-full items-center justify-center rounded-md py-3 text-lg font-normal transition-all duration-200 ease-in-out ${
                isConfigValid && !isLoading
                  ? "bg-[#0E00D0] text-white shadow-lg shadow-blue-900/30 hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-700 text-gray-500"
              }`}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <svg
                      className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Preparando prova...
                  </motion.span>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Criar simulado
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface ProvasFamosasPanelProps {
  searchTerm?: string;
}

const ProvasFamosasPanel = ({ searchTerm = "" }: ProvasFamosasPanelProps) => {
  const [provas, setProvas] = useState<ProvaGroup[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provaSelecionada, setProvaSelecionada] = useState<ProvaGroup | null>(
    null,
  );
  const [edicoes, setEdicoes] = useState<ProvaEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEdicoes, setLoadingEdicoes] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);

  const router = useRouter();

  const [showSimuladoStartModal, setShowSimuladoStartModal] = useState(false);
  const [createdSimuladoId, setCreatedSimuladoId] = useState<number | null>(
    null,
  );
  const [createdSimuladoTime, setCreatedSimuladoTime] = useState<number | null>(
    null,
  );
  const [createdSimuladoQuestionCount, setCreatedSimuladoQuestionCount] =
    useState<number | null>(null);
  const [createdSimuladoTitle, setCreatedSimuladoTitle] = useState("");

  const { data: session, status } = useSession();
  const token = session?.laravelToken;

  const notify = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setNotice({ message, type });

    window.setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

  useEffect(() => {
    const carregarProvas = async () => {
      if (status === "loading") return;

      if (status !== "authenticated" || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const provasDisponiveis = await getAvailableExams(token);
        setProvas(provasDisponiveis);
      } catch (error) {
        console.error("Erro ao carregar provas:", error);
        notify("Erro ao carregar provas famosas.", "error");
      } finally {
        setLoading(false);
      }
    };

    carregarProvas();
  }, [status, token]);

  const provasFiltradas = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();

    const provasAtivas = provas.filter((prova) => prova.is_active === true);

    if (!termo) return provasAtivas;

    return provasAtivas.filter((prova) => {
      const nome = prova.nome?.toLowerCase() ?? "";
      const sigla = prova.sigla?.toLowerCase() ?? "";
      const tipo = prova.tipo?.toLowerCase() ?? "";

      return (
        nome.includes(termo) || sigla.includes(termo) || tipo.includes(termo)
      );
    });
  }, [provas, searchTerm]);

  const handleProvaClick = async (prova: ProvaGroup) => {
    if (!token) {
      notify("Sessão inválida. Faça login novamente.", "error");
      return;
    }

    setProvaSelecionada(prova);
    setLoadingEdicoes(true);

    try {
      const edicoesDaProva = await getEditionsByExam(token, prova.id);

      if (edicoesDaProva.length === 0) {
        notify("Esta prova ainda não possui edições elegíveis.", "info");
        return;
      }

      setEdicoes(edicoesDaProva);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar edições:", error);
      notify("Erro ao carregar edições da prova.", "error");
    } finally {
      setLoadingEdicoes(false);
    }
  };

  const handleDownloadCreatedSimuladoPdf = async () => {
    if (!token) {
      notify("Sessão inválida. Faça login novamente.", "error");
      return;
    }

    if (!createdSimuladoId) {
      notify("Simulado não encontrado para download.", "error");
      return;
    }

    setDownloadingPdf(true);

    try {
      const safeTitle = createdSimuladoTitle
        ? createdSimuladoTitle
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9-_ ]/g, "")
            .trim()
            .replace(/\s+/g, "-")
        : `simulado-${createdSimuladoId}`;

      await baixarPdfDaLista(
        token,
        createdSimuladoId,
        `${safeTitle || `simulado-${createdSimuladoId}`}.pdf`,
      );

      notify("PDF baixado com sucesso.", "success");
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      notify("Não foi possível baixar o PDF.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCreatedSimulado = (payload: CreatedSimuladoPayload) => {
    setCreatedSimuladoId(payload.listId);
    setCreatedSimuladoTime(payload.time);
    setCreatedSimuladoQuestionCount(payload.questionCount);
    setCreatedSimuladoTitle(payload.title);
    setShowSimuladoStartModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
        <div className="text-lg text-white">Carregando provas...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold">Faça login para acessar.</h2>
          <p className="mt-2 text-sm text-slate-400">
            As provas famosas dependem da sua sessão para gerar simulados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl bg-slate-950 p-4 font-sans sm:p-8">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.message}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed right-4 top-4 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
              notice.type === "error"
                ? "border-red-500/30 bg-red-950/80 text-red-100"
                : notice.type === "success"
                  ? "border-emerald-500/30 bg-emerald-950/80 text-emerald-100"
                  : "border-blue-500/30 bg-blue-950/80 text-blue-100"
            }`}
          >
            {notice.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl">
        {/* <h1 className="mb-2 text-center text-3xl font-extrabold text-white">
          Provas Famosas
        </h1>

        <p className="mb-8 text-center text-gray-400">
          Selecione uma prova para ver as edições disponíveis
        </p> */}

        {loadingEdicoes && (
          <div className="mb-6 rounded-lg border border-blue-900 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">
            Carregando edições...
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {provasFiltradas.map((prova, index) => {
            const coverUrl = getProvaCoverUrl(prova as ProvaGroupWithCover);

            return (
              <motion.div
                key={prova.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleProvaClick(prova)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220] shadow-xl shadow-black/20 transition-all duration-300 hover:border-[#0E00D0]/70 hover:bg-[#10182A]"
              >
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={prova.sigla || prova.nome}
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                      <BookIcon className="h-12 w-12 text-slate-500" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/30 to-transparent" />

                  {prova.sigla && (
                    <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                      {prova.sigla}
                    </div>
                  )}

                  {prova.tipo && (
                    <div className="absolute bottom-4 left-4 rounded-full border border-blue-400/20 bg-blue-950/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
                      {prova.tipo}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 text-lg font-semibold text-white transition group-hover:text-blue-200">
                    {prova.nome}
                  </h3>

                  {prova.descricao && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                      {prova.descricao}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <div className="text-xs text-slate-500">Edições</div>
                      <div className="mt-1 font-semibold text-slate-100">
                        {prova.total_edicoes}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <div className="text-xs text-slate-500">Questões</div>
                      <div className="mt-1 font-semibold text-slate-100">
                        {prova.total_questoes ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-sm text-slate-400 transition group-hover:text-slate-200">
                    Ver edições disponíveis
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {provasFiltradas.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            Nenhuma prova encontrada.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <SimuladoConfigModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            provaSelecionada={provaSelecionada}
            edicoes={edicoes}
            onCreatedSimulado={handleCreatedSimulado}
            onNotify={notify}
          />
        )}
      </AnimatePresence>

      {showSimuladoStartModal && createdSimuladoId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#08111F] p-6 text-white shadow-2xl">
            <div className="w-fit rounded-full border border-blue-700 bg-blue-950/40 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
              Simulado criado
            </div>

            <h2 className="mt-4 text-2xl font-black">
              Preparar para iniciar a prova
            </h2>

            <p className="mt-2 text-sm font-semibold text-blue-200">
              {createdSimuladoTitle}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              O simulado foi gerado com sucesso. Antes de começar, você pode
              abrir o PDF da prova ou iniciar diretamente a resolução.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Questões
                </div>
                <div className="mt-1 text-2xl font-black">
                  {createdSimuladoQuestionCount ?? "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Tempo escolhido
                </div>
                <div className="mt-1 text-2xl font-black">
                  {createdSimuladoTime ?? "—"} min
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-4 text-sm text-yellow-100">
              Ao iniciar, trate como prova real. O cronômetro será usado
              conforme o tempo escolhido.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleDownloadCreatedSimuladoPdf}
                disabled={downloadingPdf}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingPdf ? "Baixando PDF..." : "Baixar PDF"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSimuladoStartModal(false);
                  router.push(
                    `/exercicios/provas-famosas/${createdSimuladoId}`,
                  );
                }}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
              >
                Ver sem iniciar
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSimuladoStartModal(false);
                  router.push(
                    `/exercicios/provas-famosas/${createdSimuladoId}?start=1`,
                  );
                }}
                className="rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Iniciar simulado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvasFamosasPanel;
