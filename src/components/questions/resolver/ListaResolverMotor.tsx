// components/questions/resolver/ListaResolverMotor.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { NavigationProvider } from "@/contexts/NavigationContext";
import { QuestionsPanel } from "@/components/questions/QuestionsPanel";
import { NavigationSidebar } from "@/components/questions/NavigationSidebar";
import { useSearchParams } from "next/navigation";

import { getListaById } from "@/lib/questions/list";
import {
  iniciarTentativa,
  finalizarTentativa,
  getTentativaAtiva,
  getResultadoTentativa,
} from "@/lib/questions/tentativa";

import type {
  Alternativa,
  Questao,
  ListaCompleta,
  Topico,
  Assunto,
  Frente,
  TopicoCompleto,
} from "@/types/list";

import type {
  QuestaoBase,
  QuestaoTipo,
  RespostaQuestao,
  RespostasPorQuestao,
  GabaritoCertoErrado,
} from "@/types/questions";

type ResolverModoForcado = "treino" | "simulado";

type PopupType = "success" | "error" | "warning" | "info";

type PopupState = {
  open: boolean;
  type: PopupType;
  title: string;
  message: string;
};

interface ListaResolverMotorProps {
  listaId: number;
  modoForcado?: ResolverModoForcado;
  tituloLoading?: string;
  debugLabel?: string;
  paddingTopMobile?: boolean;
  variant?: "page" | "embedded";
}

function normalizarTipoQuestao(tipo: unknown): QuestaoTipo {
  if (
    tipo === "objetiva" ||
    tipo === "discursiva" ||
    tipo === "resposta_numerica" ||
    tipo === "certo_errado"
  ) {
    return tipo;
  }

  return "objetiva";
}

function normalizarGabaritoCertoErrado(
  valor: unknown,
): GabaritoCertoErrado | null {
  if (valor === "certo" || valor === "errado") {
    return valor;
  }

  if (valor === "verdadeiro") {
    return "certo";
  }

  if (valor === "falso") {
    return "errado";
  }

  return null;
}

function montarRespostaSalva(
  resposta: any,
  questaoTipo: QuestaoTipo,
): RespostaQuestao | null {
  const questaoId = Number(resposta?.questao_id);

  if (!questaoId) {
    return null;
  }

  const tipo = normalizarTipoQuestao(resposta?.tipo || questaoTipo);

  const correta =
    typeof resposta?.correta === "boolean"
      ? resposta.correta
      : typeof resposta?.foi_correta === "boolean"
        ? resposta.foi_correta
        : null;

  if (tipo === "objetiva") {
    const alternativaId =
      resposta?.alternativa_id === null ||
      resposta?.alternativa_id === undefined
        ? null
        : Number(resposta.alternativa_id);

    return {
      tipo: "objetiva",
      questao_id: questaoId,
      alternativa_id: alternativaId,
      correta,
    };
  }

  if (tipo === "discursiva") {
    if (typeof correta !== "boolean") {
      return null;
    }

    return {
      tipo: "discursiva",
      questao_id: questaoId,
      resposta_texto: resposta?.resposta_texto
        ? String(resposta.resposta_texto)
        : "",
      correta,
    };
  }

  if (tipo === "resposta_numerica") {
    if (
      resposta?.resposta_numerica === undefined ||
      resposta?.resposta_numerica === null
    ) {
      return null;
    }

    return {
      tipo: "resposta_numerica",
      questao_id: questaoId,
      resposta_numerica: String(resposta.resposta_numerica),
      correta,
    };
  }

  if (tipo === "certo_errado") {
    const respostaCertoErrado = normalizarGabaritoCertoErrado(
      resposta?.resposta_certo_errado,
    );

    if (!respostaCertoErrado) {
      return null;
    }

    return {
      tipo: "certo_errado",
      questao_id: questaoId,
      resposta_certo_errado: respostaCertoErrado,
      correta,
    };
  }

  return null;
}

function extrairQuestoesDaResposta(dadosLista: any): Questao[] {
  if (dadosLista?.questoes && Array.isArray(dadosLista.questoes)) {
    return dadosLista.questoes;
  }

  if (
    dadosLista?.lista_info?.questoes &&
    Array.isArray(dadosLista.lista_info.questoes)
  ) {
    return dadosLista.lista_info.questoes;
  }

  if (Array.isArray(dadosLista)) {
    return dadosLista;
  }

  if (dadosLista?.data && Array.isArray(dadosLista.data)) {
    return dadosLista.data;
  }

  throw new Error("Estrutura de resposta da API inesperada");
}

function montarListaInfo(
  dadosLista: any,
  listaId: number,
  modoForcado?: ResolverModoForcado,
): ListaCompleta {
  const listaInfo = dadosLista?.lista_info ?? dadosLista ?? {};

  const tipoOriginal = listaInfo.tipo ?? "pessoal";

  const tipoEfetivo =
    modoForcado === "simulado"
      ? "simulado"
      : modoForcado === "treino"
        ? tipoOriginal
        : tipoOriginal;

  return {
    id: listaInfo.id || listaId,
    nome: listaInfo.name || listaInfo.nome || `Lista ${listaId}`,
    descricao: listaInfo.descricao || "Lista de exercícios",
    total_time_in_seconds: listaInfo.total_time_in_seconds || 0,
    user_id: listaInfo.user_id,
    is_public: listaInfo.is_public,
    time: listaInfo.time,
    tipo: tipoEfetivo,
    created_at: listaInfo.created_at,
    updated_at: listaInfo.updated_at,
    average_difficulty: listaInfo.average_difficulty,
    most_frequent_assunto: listaInfo.most_frequent_assunto,
  } as ListaCompleta;
}

function formatarQuestaoParaResolver(questao: Questao): QuestaoBase {
  const questaoAny = questao as any;

  const provaInfo = questao.prova
    ? {
        banca: {
          nome: questao.prova.nome || "Banca não informada",
        },
        ano: questao.prova.ano || 0,
        sigla: questao.prova.sigla || undefined,
      }
    : {
        banca: { nome: "Banca não informada" },
        ano: 0,
        sigla: undefined,
      };

  const topicosFormatados = Array.isArray(questao.topicos)
    ? questao.topicos.map((topico: Topico) => ({
        id: topico.id,
        nome: topico.nome,
      }))
    : [];

  const alternativasFormatadas = Array.isArray(questao.alternativas)
    ? questao.alternativas.map((alt: Alternativa) => ({
        id: alt.id,
        letra: alt.letra,
        texto: alt.texto,
      }))
    : [];

  return {
    id: questao.id,
    tipo: normalizarTipoQuestao(questaoAny.tipo),

    enunciado: questao.enunciado || "Enunciado não disponível",
    dificuldade: questao.dificuldade ?? 3,

    alternativa_correta_id: questaoAny.alternativa_correta_id ?? null,
    alternativas: alternativasFormatadas,

    resposta_esperada: questaoAny.resposta_esperada ?? null,
    criterio_correcao: questaoAny.criterio_correcao ?? null,

    gabarito_certo_errado: normalizarGabaritoCertoErrado(
      questaoAny.gabarito_certo_errado,
    ),

    resposta_numerica: questaoAny.resposta_numerica ?? null,

    topicos: topicosFormatados,
    prova: provaInfo,

    gabarito_video: questaoAny.gabarito_video ?? null,
    gabarito_comentado_texto:
      questaoAny.gabarito_comentado_texto ??
      "Gabarito comentado não disponível.",

    adaptado: !!questaoAny.adaptado,
  };
}

function calcularTempoRestanteSegundos(tentativa: any): number | null {
  if (!tentativa?.started_at || !tentativa?.tempo_escolhido) {
    return null;
  }

  const startedAt = new Date(tentativa.started_at).getTime();

  if (Number.isNaN(startedAt)) {
    return null;
  }

  /**
   * tempo_escolhido está em minutos.
   */
  const duracaoTotalSegundos = Number(tentativa.tempo_escolhido) * 60;

  const agora = Date.now();
  const decorridoSegundos = Math.floor((agora - startedAt) / 1000);

  return Math.max(0, duracaoTotalSegundos - decorridoSegundos);
}

function formatarTempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function ListaResolverMotor({
  listaId,
  modoForcado,
  tituloLoading = "Carregando lista...",
  debugLabel = "ListaResolverMotor",
  paddingTopMobile = false,
  variant = "page",
}: ListaResolverMotorProps) {
  const searchParams = useSearchParams();
  const shouldAutoStart = searchParams.get("start") === "1";
  const autoStartExecutadoRef = useRef(false);
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);

  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [topicos, setTopicos] = useState<TopicoCompleto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [resolucaoId, setResolucaoId] = useState<number | null>(null);

  const [tentativaAtiva, setTentativaAtiva] = useState<any | null>(null);
  const [tempoRestanteSegundos, setTempoRestanteSegundos] = useState<
    number | null
  >(null);
  const [contadorOculto, setContadorOculto] = useState(false);
  const [isFinalizandoPorTempo, setIsFinalizandoPorTempo] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [respostasSalvas, setRespostasSalvas] = useState<RespostasPorQuestao>(
    {},
  );
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [isCreatingRepeatAttempt, setIsCreatingRepeatAttempt] = useState(false);

  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isMobile, setIsMobile] = useState(false);
  const navbarRef = useRef<HTMLElement | null>(null);

  const [popup, setPopup] = useState<PopupState>({
    open: false,
    type: "info",
    title: "",
    message: "",
  });

  function openPopup({
    type = "info",
    title,
    message,
  }: {
    type?: PopupType;
    title: string;
    message: string;
  }) {
    setPopup({
      open: true,
      type,
      title,
      message,
    });
  }

  function closePopup() {
    setPopup((current) => ({
      ...current,
      open: false,
    }));
  }

  function getPopupStyles(type: PopupType) {
    if (type === "success") {
      return {
        badge: "bg-green-500/15 text-green-300 border-green-500/30",
        button: "bg-green-600 hover:bg-green-700",
      };
    }

    if (type === "error") {
      return {
        badge: "bg-red-500/15 text-red-300 border-red-500/30",
        button: "bg-red-600 hover:bg-red-700",
      };
    }

    if (type === "warning") {
      return {
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        button: "bg-amber-600 hover:bg-amber-700",
      };
    }

    return {
      badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      button: "bg-[#0E00D0] hover:bg-blue-700",
    };
  }

  useEffect(() => {
    const navbar = document.querySelector("nav") as HTMLElement | null;
    navbarRef.current = navbar;

    const updateNavbarHeight = () => {
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateNavbarHeight();
    checkIfMobile();

    const resizeObserver = new ResizeObserver(updateNavbarHeight);

    if (navbar) {
      resizeObserver.observe(navbar);
    }

    window.addEventListener("resize", checkIfMobile);

    return () => {
      if (navbar) {
        resizeObserver.unobserve(navbar);
      }

      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchListaData = async () => {
      if (status === "loading") {
        return;
      }

      if (status === "unauthenticated") {
        if (isMounted) {
          setError("Você precisa estar logado para acessar esta lista.");
          setIsLoading(false);
        }

        return;
      }

      if (!session?.laravelToken) {
        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      if (!listaId || Number.isNaN(Number(listaId))) {
        if (isMounted) {
          setError("ID da lista não fornecido.");
          setIsLoading(false);
        }

        return;
      }

      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        const token = session.laravelToken;
        const idNumber = Number(listaId);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Timeout ao carregar lista")),
            10000,
          );
        });

        const fetchPromise = Promise.all([
          getListaById(idNumber, token),
          getTentativaAtiva(idNumber, token),
        ]);

        const [dadosLista, tentativaExistente] = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as any;

        if (!isMounted) return;

        const questoesData = extrairQuestoesDaResposta(dadosLista);

        if (!questoesData || questoesData.length === 0) {
          throw new Error("Nenhuma questão encontrada na lista");
        }

        const assuntosDaLista: Assunto[] =
          dadosLista?.lista_info?.assuntos || [];
        const frentesDaLista: Frente[] = dadosLista?.lista_info?.frentes || [];
        const topicosDaLista: TopicoCompleto[] =
          dadosLista?.lista_info?.topicos || [];

        const listaInfoData = montarListaInfo(
          dadosLista,
          idNumber,
          modoForcado,
        );

        const respostas: RespostasPorQuestao = {};

        if (
          tentativaExistente?.respostas &&
          Array.isArray(tentativaExistente.respostas)
        ) {
          tentativaExistente.respostas.forEach((resposta: any) => {
            const questaoId = Number(resposta.questao_id);

            const questaoOriginal = questoesData.find(
              (questao: any) => Number(questao.id) === questaoId,
            );

            const questaoTipo = normalizarTipoQuestao(questaoOriginal?.tipo);

            const respostaFormatada = montarRespostaSalva(
              resposta,
              questaoTipo,
            );

            if (respostaFormatada) {
              respostas[questaoId] = respostaFormatada;
            }
          });
        }

        setAssuntos(assuntosDaLista);
        setFrentes(frentesDaLista);
        setTopicos(topicosDaLista);
        setQuestoes(questoesData);
        setListaInfo(listaInfoData);

        if (tentativaExistente) {
          setResolucaoId(tentativaExistente.id);
          setTentativaAtiva(tentativaExistente);
          setRespostasSalvas(respostas);

          if (tentativaExistente.status === "finalizado") {
            setTempoRestanteSegundos(0);
          } else {
            const restante = calcularTempoRestanteSegundos(tentativaExistente);
            setTempoRestanteSegundos(restante);
          }
        } else {
          setResolucaoId(null);
          setTentativaAtiva(null);
          setRespostasSalvas({});
          setTempoRestanteSegundos(null);
        }
      } catch (err: any) {
        if (!isMounted) return;

        console.error(`Erro ao carregar lista no ${debugLabel}:`, err);

        if (err.message === "Timeout ao carregar lista") {
          setError(
            "Tempo limite excedido ao carregar a lista. Tente novamente.",
          );
        } else if (err.message?.includes("Nenhuma questão encontrada")) {
          setError("Nenhuma questão encontrada nesta lista.");
        } else if (err.message?.includes("Estrutura de resposta")) {
          setError("Erro no formato da resposta da API. Tente novamente.");
        } else {
          setError("Falha ao carregar a lista de exercícios. Tente novamente.");
        }

        setQuestoes([]);
        setListaInfo(null);
        setResolucaoId(null);
        setRespostasSalvas({});
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchListaData();

    return () => {
      isMounted = false;
    };
  }, [listaId, session?.laravelToken, status, modoForcado, debugLabel]);

  const isSimuladoOuProva = useMemo(() => {
    if (modoForcado === "simulado") {
      return true;
    }

    return Boolean(
      listaInfo?.tipo && ["simulado", "prova"].includes(listaInfo.tipo),
    );
  }, [listaInfo?.tipo, modoForcado]);

  const simuladoFinalizado = useMemo(() => {
    return Boolean(
      isSimuladoOuProva &&
      tentativaAtiva &&
      tentativaAtiva.status === "finalizado",
    );
  }, [isSimuladoOuProva, tentativaAtiva]);

  useEffect(() => {
    if (!isSimuladoOuProva) {
      setTempoRestanteSegundos(null);
      return;
    }

    if (!tentativaAtiva || !resolucaoId) {
      setTempoRestanteSegundos(null);
      return;
    }

    if (tentativaAtiva.status === "finalizado") {
      setTempoRestanteSegundos(0);
      return;
    }

    const atualizarTempo = () => {
      const restante = calcularTempoRestanteSegundos(tentativaAtiva);
      setTempoRestanteSegundos(restante);

      if (restante === 0 && !isFinalizandoPorTempo) {
        setIsFinalizandoPorTempo(true);

        finalizarTentativa(resolucaoId, session?.laravelToken || "")
          .then(async (resultado) => {
            openPopup({
              type: "warning",
              title: "Tempo encerrado",
              message: "Sua tentativa foi finalizada automaticamente.",
            });

            setResolucaoId(resultado.resolucao.id);
            setTentativaAtiva(resultado.resolucao);
            setTempoRestanteSegundos(0);

            const token = session?.laravelToken;

            if (!token) return;

            const resultadoCompleto = await getResultadoTentativa(
              resultado.resolucao.id,
              token,
            );

            const respostas: RespostasPorQuestao = {};

            if (Array.isArray(resultadoCompleto?.respostas)) {
              resultadoCompleto.respostas.forEach((resposta: any) => {
                const questaoId = Number(resposta.questao_id);

                const questaoOriginal = questoes.find(
                  (questao: any) => Number(questao.id) === questaoId,
                );

                const questaoTipo = normalizarTipoQuestao(
                  questaoOriginal?.tipo,
                );

                const respostaFormatada = montarRespostaSalva(
                  resposta,
                  questaoTipo,
                );

                if (respostaFormatada) {
                  respostas[questaoId] = respostaFormatada;
                }
              });
            }

            setRespostasSalvas(respostas);
          })
          .catch((error) => {
            console.error("Erro ao finalizar tentativa por tempo:", error);
            openPopup({
              type: "error",
              title: "Erro ao finalizar",
              message:
                "O tempo acabou, mas houve erro ao finalizar. Recarregue a página.",
            });
          })
          .finally(() => {
            setIsFinalizandoPorTempo(false);
          });
      }
    };

    atualizarTempo();

    const interval = window.setInterval(atualizarTempo, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    isSimuladoOuProva,
    tentativaAtiva,
    resolucaoId,
    session?.laravelToken,
    isFinalizandoPorTempo,
    questoes,
  ]);

  const questionsFormatted = useMemo<QuestaoBase[]>(() => {
    return questoes.map(formatarQuestaoParaResolver);
  }, [questoes]);

  const handleIniciarTentativa = async (): Promise<number> => {
    const token = session?.laravelToken;

    if (!token) {
      openPopup({
        type: "error",
        title: "Sessão inválida",
        message: "Faça login novamente.",
      });
      throw new Error("Sessão inválida");
    }

    const novaTentativa = await iniciarTentativa(Number(listaId), token);

    setResolucaoId(novaTentativa.id);
    setTentativaAtiva(novaTentativa);
    setRespostasSalvas({});
    setTempoRestanteSegundos(calcularTempoRestanteSegundos(novaTentativa));
    setContadorOculto(false);
    setShowRepeatModal(false);

    return novaTentativa.id;
  };

  useEffect(() => {
    if (!shouldAutoStart) return;
    if (!isSimuladoOuProva) return;
    if (!listaInfo?.id) return;
    if (autoStartExecutadoRef.current) return;

    /**
     * Se já existe tentativa em andamento, não cria outra.
     */
    if (tentativaAtiva?.status === "iniciado") {
      autoStartExecutadoRef.current = true;
      return;
    }

    /**
     * Se não existe tentativa, ou se a última está finalizada,
     * cria uma nova tentativa de simulado.
     */
    autoStartExecutadoRef.current = true;

    handleIniciarTentativa().catch((error) => {
      console.error("Erro ao iniciar simulado automaticamente:", error);
      autoStartExecutadoRef.current = false;
    });
  }, [
    shouldAutoStart,
    isSimuladoOuProva,
    listaInfo?.id,
    tentativaAtiva?.status,
  ]);

  const handleFinalizarTentativa = async () => {
    if (simuladoFinalizado || tentativaAtiva?.status === "finalizado") {
      openPopup({
        type: "info",
        title: "Tentativa já finalizada",
        message: "Esta tentativa já foi finalizada.",
      });
      return;
    }

    if (tentativaAtiva?.status === "finalizado") {
      openPopup({
        type: "info",
        title: "Tentativa já finalizada",
        message: "Esta tentativa já foi finalizada.",
      });
      return;
    }

    const token = session?.laravelToken;

    if (!token) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!resolucaoId) {
      console.warn("Nenhuma tentativa ativa para finalizar");
      return;
    }

    try {
      const resultado = await finalizarTentativa(resolucaoId, token);

      const resolucaoFinalizada = resultado.resolucao;

      setResolucaoId(resolucaoFinalizada.id);
      setTentativaAtiva(resolucaoFinalizada);
      setTempoRestanteSegundos(0);

      /**
       * Importante:
       * Depois de finalizar, precisamos buscar a tentativa completa
       * com respostas já corrigidas.
       */
      const resultadoCompleto = await getResultadoTentativa(
        resolucaoFinalizada.id,
        token,
      );

      const respostas: RespostasPorQuestao = {};

      if (Array.isArray(resultadoCompleto?.respostas)) {
        resultadoCompleto.respostas.forEach((resposta: any) => {
          const questaoId = Number(resposta.questao_id);

          const questaoOriginal = questoes.find(
            (questao: any) => Number(questao.id) === questaoId,
          );

          const questaoTipo = normalizarTipoQuestao(questaoOriginal?.tipo);

          const respostaFormatada = montarRespostaSalva(resposta, questaoTipo);

          if (respostaFormatada) {
            respostas[questaoId] = respostaFormatada;
          }
        });
      }

      setRespostasSalvas(respostas);

      openPopup({
        type: "success",
        title: "Tentativa finalizada",
        message: `Pontuação: ${resolucaoFinalizada.score_final}`,
      });
    } catch (err) {
      console.error("Erro ao finalizar tentativa:", err);
      openPopup({
        type: "error",
        title: "Erro ao finalizar tentativa",
        message: "Tente novamente.",
      });
    }
  };

  const handleRepetirSimulado = async () => {
    const token = session?.laravelToken;

    if (!token) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!listaId) {
      openPopup({
        type: "error",
        title: "Lista inválida",
        message: "Não foi possível identificar esta lista.",
      });
      return;
    }

    try {
      setIsCreatingRepeatAttempt(true);

      const novaTentativa = await iniciarTentativa(Number(listaId), token);

      setResolucaoId(novaTentativa.id);
      setTentativaAtiva(novaTentativa);
      setRespostasSalvas({});
      setTempoRestanteSegundos(calcularTempoRestanteSegundos(novaTentativa));
      setContadorOculto(false);
      setShowRepeatModal(false);
    } catch (error) {
      console.error("Erro ao repetir simulado:", error);
      openPopup({
        type: "error",
        title: "Erro ao iniciar nova tentativa",
        message: "Tente novamente.",
      });
    } finally {
      setIsCreatingRepeatAttempt(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div
        className={
          variant === "embedded"
            ? "flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-[#00091A]"
            : "flex h-screen items-center justify-center bg-[#00091A]"
        }
      >
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white text-lg">{tituloLoading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <div className="text-xl mb-4">{error}</div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>

            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questionsFormatted || questionsFormatted.length === 0) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Nenhuma questão encontrada.</div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <NavigationProvider
      questions={questionsFormatted}
      respostasSalvas={respostasSalvas}
      isSimuladoOuProva={isSimuladoOuProva}
    >
      <div
        className={
          variant === "embedded"
            ? "flex min-h-[720px] overflow-hidden rounded-2xl border border-slate-200 bg-[#F8F8F8] dark:border-white/10 dark:bg-[#00091A]"
            : "flex overflow-hidden bg-[#F8F8F8] dark:bg-[#00091A]"
        }
        style={
          variant === "embedded"
            ? {
                height: "calc(100vh - 180px)",
                minHeight: "720px",
              }
            : {
                height: `calc(100vh - ${navbarHeight}px)`,
                paddingTop: paddingTopMobile && isMobile ? "60px" : "0",
              }
        }
      >
        <NavigationSidebar
          assuntos={assuntos}
          frentes={frentes}
          topicos={topicos}
          listaInfo={listaInfo ?? undefined}
          resolucaoId={resolucaoId}
          onFinalizarTentativa={handleFinalizarTentativa}
          podeFinalizarTentativa={!simuladoFinalizado}
          navbarHeight={navbarHeight}
        />

        {isSimuladoOuProva &&
          tempoRestanteSegundos !== null &&
          !simuladoFinalizado && (
            <>
              {contadorOculto ? (
                <button
                  onClick={() => setContadorOculto(false)}
                  className="fixed bottom-6 right-6 z-[999] rounded-full border border-blue-300 bg-white px-4 py-3 text-sm font-bold text-[#0E00D0] shadow-2xl transition hover:bg-blue-50 dark:border-blue-700 dark:bg-[#050B1A] dark:text-white dark:hover:bg-blue-950"
                >
                  Mostrar tempo
                </button>
              ) : (
                <div
                  className={`fixed bottom-6 right-6 z-[999] rounded-2xl border px-5 py-4 shadow-2xl ${
                    tempoRestanteSegundos <= 30
                      ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950 dark:text-red-100"
                      : "border-blue-300 bg-white text-slate-950 dark:border-blue-700 dark:bg-[#050B1A] dark:text-white"
                  }`}
                >
                  <button
                    onClick={() => setContadorOculto(true)}
                    className="absolute right-2 top-2 rounded-md px-2 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                    title="Ocultar contador"
                  >
                    ×
                  </button>

                  <div className="pr-6">
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Tempo restante
                    </div>

                    <div className="text-3xl font-black tabular-nums">
                      {formatarTempo(tempoRestanteSegundos)}
                    </div>

                    {tempoRestanteSegundos <= 30 && (
                      <div className="mt-1 text-xs font-semibold text-red-600 dark:text-red-300">
                        Últimos segundos
                      </div>
                    )}

                    {isFinalizandoPorTempo && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-300">
                        Finalizando...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        {simuladoFinalizado && (
          <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3">
            <button
              onClick={() => setShowRepeatModal(true)}
              className="rounded-2xl border border-blue-700 bg-[#0E00D0] px-5 py-3 text-sm font-black text-white shadow-2xl transition hover:bg-blue-700"
            >
              Repetir simulado
            </button>
          </div>
        )}

        <QuestionsPanel
          className="flex-1 overflow-y-auto"
          questions={questionsFormatted}
          resolucaoId={resolucaoId}
          respostasSalvas={respostasSalvas}
          onIniciarTentativa={handleIniciarTentativa}
          listaId={listaInfo?.id}
          listaTipo={isSimuladoOuProva ? "simulado" : listaInfo?.tipo}
          tempoEncerrado={tempoRestanteSegundos === 0}
          simuladoFinalizado={simuladoFinalizado}
        />

        {process.env.NODE_ENV === "development" && (
          <div className="fixed bottom- right-3 bg-white/90 text-slate-950 p-3 rounded-md border border-slate-300 text-xs z-[1000] font-mono shadow-2xl dark:bg-black/80 dark:text-white dark:border-gray-700">
            <div className="font-bold mb-1">DEBUG: {debugLabel}</div>
            <div>Lista ID: {listaId}</div>
            <div>Questões: {questionsFormatted.length}</div>
            <div>Lista Info: {listaInfo ? "Sim" : "Não"}</div>
            <div>Tipo: {listaInfo?.tipo || "N/A"}</div>
            <div>Simulado: {isSimuladoOuProva ? "Sim" : "Não"}</div>
            <div>Tentativa ID: {resolucaoId || "Não iniciada"}</div>
            <div>Status: {status}</div>
          </div>
        )}
      </div>

      {showRepeatModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 dark:bg-black/70">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#08111F] dark:text-white">
            <h2 className="text-2xl font-black">Repetir simulado</h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Você irá iniciar uma nova tentativa deste simulado. O tempo será
              de{" "}
              <strong className="text-slate-950 dark:text-white">
                {listaInfo?.time || tentativaAtiva?.tempo_escolhido || 0}{" "}
                minuto(s)
              </strong>
              . Prepare-se antes de começar, pois o cronômetro começará assim
              que a nova tentativa for criada.
            </p>

            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              A tentativa anterior continuará salva para consulta futura. Esta
              nova tentativa será registrada separadamente em Minhas Listas.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/listas/${listaId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-800 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Baixar PDF
              </a>

              <button
                onClick={() => setShowRepeatModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>

              <button
                onClick={handleRepetirSimulado}
                disabled={isCreatingRepeatAttempt}
                className="rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingRepeatAttempt
                  ? "Iniciando..."
                  : "Começar nova tentativa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popup.open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4 dark:bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#08111F] dark:text-white">
            {(() => {
              const styles = getPopupStyles(popup.type);

              return (
                <>
                  <div
                    className={`mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${styles.badge}`}
                  >
                    {popup.type === "success"
                      ? "Sucesso"
                      : popup.type === "error"
                        ? "Erro"
                        : popup.type === "warning"
                          ? "Atenção"
                          : "Aviso"}
                  </div>

                  <h2 className="text-xl font-black">{popup.title}</h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {popup.message}
                  </p>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={closePopup}
                      className={`rounded-xl px-5 py-3 text-sm font-black text-white transition ${styles.button}`}
                    >
                      Entendi
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </NavigationProvider>
  );
}
