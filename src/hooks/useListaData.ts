// hooks/useListaData.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getListaById } from "@/lib/questions/list";
import {
  iniciarTentativa,
  finalizarTentativa,
  getTentativaAtiva,
} from "@/lib/questions/tentativa";
import {
  Questao,
  ListaCompleta,
  Alternativa,
  Topico,
  Prova,
} from "@/types/list";
import { QuestaoBase } from "@/types/questions";
import type { FinalizarTentativaResponse } from "@/lib/questions/tentativa";

// Interface para a resposta da finalização

interface UseListaDataReturn {
  questionsFormatted: QuestaoBase[];
  listaInfo: ListaCompleta | null;
  resolucaoId: number | null;
  respostasSalvas: Record<number, number>;
  isLoading: boolean;
  error: string | null;
  tentativaAtiva: any;
  handleIniciarTentativa: () => Promise<number>;
  handleFinalizarTentativa: () => Promise<FinalizarTentativaResponse>;
  refetch: () => Promise<void>;
}

export function useListaData(listaId: string | string[]): UseListaDataReturn {
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
  const [resolucaoId, setResolucaoId] = useState<number | null>(null);
  const [respostasSalvas, setRespostasSalvas] = useState<
    Record<number, number>
  >({});
  const [tentativaAtiva, setTentativaAtiva] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDataRef = useRef(false);

  const processarDadosLista = (dadosLista: any, idNumber: number) => {
    let questoesData: Questao[] = [];
    let listaInfoData: ListaCompleta | null = null;

    // Verificar diferentes estruturas possíveis da resposta
    if (
      dadosLista &&
      dadosLista.questoes &&
      Array.isArray(dadosLista.questoes)
    ) {
      // Estrutura 1: questões no nível raiz
      questoesData = dadosLista.questoes;
      console.log("📋 Questões carregadas do nível raiz:", questoesData.length);
    } else if (
      dadosLista &&
      dadosLista.lista_info &&
      Array.isArray(dadosLista.lista_info.questoes)
    ) {
      // Estrutura 2: questões dentro de lista_info
      questoesData = dadosLista.lista_info.questoes;
      console.log("📋 Questões carregadas de lista_info:", questoesData.length);
    } else if (dadosLista && Array.isArray(dadosLista)) {
      // Estrutura 3: resposta é diretamente um array de questões
      questoesData = dadosLista;
      console.log(
        "📋 Questões carregadas como array direto:",
        questoesData.length
      );
    } else if (
      dadosLista &&
      dadosLista.data &&
      Array.isArray(dadosLista.data)
    ) {
      // Estrutura 4: questões dentro de data
      questoesData = dadosLista.data;
      console.log("📋 Questões carregadas de data:", questoesData.length);
    } else {
      console.warn("⚠️ Estrutura de resposta inesperada:", dadosLista);
      throw new Error("Estrutura de dados inválida da lista");
    }

    // Buscar informações da lista
    if (dadosLista.lista_info) {
      listaInfoData = {
        id: dadosLista.lista_info.id || idNumber,
        nome:
          dadosLista.lista_info.name ||
          dadosLista.lista_info.nome ||
          `Lista ${idNumber}`,
        descricao: dadosLista.lista_info.descricao || "Lista de exercícios",
        total_time_in_seconds: dadosLista.lista_info.total_time_in_seconds || 0,
        user_id: dadosLista.lista_info.user_id,
        is_public: dadosLista.lista_info.is_public,
        time: dadosLista.lista_info.time,
        tipo: dadosLista.lista_info.tipo,
        created_at: dadosLista.lista_info.created_at,
        updated_at: dadosLista.lista_info.updated_at,
        average_difficulty: dadosLista.lista_info.average_difficulty,
        most_frequent_assunto: dadosLista.lista_info.most_frequent_assunto,
      };
    } else if (dadosLista.name) {
      // Fallback: se não houver lista_info, mas houver name no nível raiz
      listaInfoData = {
        id: idNumber,
        nome: dadosLista.name || `Lista ${idNumber}`,
        descricao: dadosLista.descricao || "Lista de exercícios",
        total_time_in_seconds: dadosLista.total_time_in_seconds || 0,
        user_id: dadosLista.user_id,
        is_public: dadosLista.is_public,
        time: dadosLista.time,
        tipo: dadosLista.tipo,
        created_at: dadosLista.created_at,
        updated_at: dadosLista.updated_at,
        average_difficulty: dadosLista.average_difficulty,
        most_frequent_assunto: dadosLista.most_frequent_assunto,
      };
    } else {
      // Fallback final
      listaInfoData = {
        id: idNumber,
        nome: `Lista ${idNumber}`,
        descricao: "Lista de exercícios",
        total_time_in_seconds: 0,
        user_id: 0,
        is_public: false,
        time: undefined,
        tipo: "lista",
        created_at: "",
        updated_at: "",
        average_difficulty: 0,
        most_frequent_assunto: null,
      };
    }

    return { questoesData, listaInfoData };
  };

  const processarTentativaExistente = (tentativaExistente: any) => {
    if (!tentativaExistente) {
      console.log("🆕 Nenhuma tentativa ativa encontrada");
      return {
        resolucaoId: null,
        tentativaAtiva: null,
        respostasSalvas: {},
      };
    }

    console.log("✅ Tentativa ativa encontrada:", tentativaExistente);

    // Extrair respostas já salvas
    const respostas: Record<number, number> = {};
    if (
      tentativaExistente.respostas &&
      Array.isArray(tentativaExistente.respostas)
    ) {
      tentativaExistente.respostas.forEach((resposta: any) => {
        if (resposta.questao_id && resposta.alternativa_id) {
          respostas[resposta.questao_id] = resposta.alternativa_id;
        }
      });
    }

    console.log(
      "📝 Respostas carregadas:",
      Object.keys(respostas).length,
      "respostas"
    );

    return {
      resolucaoId: tentativaExistente.id,
      tentativaAtiva: tentativaExistente,
      respostasSalvas: respostas,
    };
  };

  const formatarQuestoes = (questoesData: Questao[]): QuestaoBase[] => {
    return questoesData.map((questao) => {
      // Formatar informações da prova
      const provaInfo = questao.prova
        ? {
            banca: {
              nome:
                questao.prova.banca?.nome ||
                questao.prova.nome ||
                "Banca não informada",
            },
            sigla: questao.prova.sigla || undefined, // ✅ usa undefined em vez de null
            ano: questao.prova.ano || 0,
          }
        : {
            banca: { nome: "Banca não informada" },
            sigla: undefined, // ✅ undefined em vez de null
            ano: 0,
          };

      // Formatar tópicos - garantir que seja um array de objetos com id e nome
      const topicosFormatados = Array.isArray(questao.topicos)
        ? questao.topicos.map((topico: Topico) => ({
            id: topico.id,
            nome: topico.nome,
          }))
        : [];

      // Formatar alternativas
      const alternativasFormatadas = Array.isArray(questao.alternativas)
        ? questao.alternativas.map((alt: Alternativa) => ({
            id: alt.id,
            letra: alt.letra,
            texto: alt.texto,
          }))
        : [];

      // ✅ GARANTIR que todas as propriedades obrigatórias estejam presentes
      const questaoFormatada: QuestaoBase = {
        id: questao.id,
        enunciado: questao.enunciado || "Enunciado não disponível",
        dificuldade: questao.dificuldade || 3, // Default para dificuldade média
        alternativa_correta_id: questao.alternativa_correta_id,
        alternativas: alternativasFormatadas,
        topicos: topicosFormatados,
        prova: provaInfo,
        adaptado: !!questao.adaptado,
        gabarito_video: questao.gabarito_video || null,
        gabarito_comentado_texto:
          questao.gabarito_comentado_texto ||
          "Gabarito comentado não disponível.",
      };

      // Verificar se todas as propriedades obrigatórias estão presentes
      if (!questaoFormatada.dificuldade) {
        console.warn(
          `⚠️ Questão ${questaoFormatada.id} sem dificuldade, usando valor padrão: 3`
        );
        questaoFormatada.dificuldade = 3;
      }

      return questaoFormatada;
    });
  };

  const fetchListaData = async () => {
    if (fetchDataRef.current) {
      console.log("🛑 fetchListaData já foi executado, ignorando...");
      return;
    }

    if (status === "authenticated" && session?.laravelToken && listaId) {
      try {
        fetchDataRef.current = true;
        setIsLoading(true);
        setError(null);

        const token = session.laravelToken;
        const idNumber = parseInt(
          Array.isArray(listaId) ? listaId[0] : listaId,
          10
        );

        if (isNaN(idNumber)) {
          throw new Error("ID da lista inválido");
        }

        console.log("🔍 Buscando lista com ID:", idNumber);
        const [dadosLista, tentativaExistente] = await Promise.all([
          getListaById(idNumber, token),
          getTentativaAtiva(idNumber, token),
        ]);

        console.log("📦 Dados da lista recebidos:", dadosLista);
        console.log("📦 Tentativa existente:", tentativaExistente);

        // Processar dados da lista
        const { questoesData, listaInfoData } = processarDadosLista(
          dadosLista,
          idNumber
        );

        // Processar tentativa existente
        const tentativaData = processarTentativaExistente(tentativaExistente);

        console.log("✅ Processamento concluído:");
        console.log("   - Questões:", questoesData.length);
        console.log("   - Lista:", listaInfoData?.nome);
        console.log("   - Tentativa ID:", tentativaData.resolucaoId);
        console.log(
          "   - Respostas salvas:",
          Object.keys(tentativaData.respostasSalvas).length
        );

        setQuestoes(questoesData);
        setListaInfo(listaInfoData);
        setResolucaoId(tentativaData.resolucaoId);
        setTentativaAtiva(tentativaData.tentativaAtiva);
        setRespostasSalvas(tentativaData.respostasSalvas);
      } catch (err) {
        console.error("❌ Erro detalhado ao carregar lista:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao carregar a lista de exercícios. Tente novamente."
        );
      } finally {
        setIsLoading(false);
      }
    } else if (status === "unauthenticated") {
      setError("Você precisa estar logado para acessar esta lista.");
      setIsLoading(false);
    } else if (!listaId) {
      setError("ID da lista não fornecido.");
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListaData();

    return () => {
      fetchDataRef.current = false;
    };
  }, [listaId, session, status]);

  const handleIniciarTentativa = async (): Promise<number> => {
    if (!listaId) throw new Error("ID da lista não disponível");
    if (!session?.laravelToken) throw new Error("Usuário não autenticado");

    const token = session.laravelToken;

    try {
      console.log("🎯 Iniciando nova tentativa...");
      const idNumber = parseInt(
        Array.isArray(listaId) ? listaId[0] : listaId,
        10
      );

      if (isNaN(idNumber)) {
        throw new Error("ID da lista inválido");
      }

      const novaTentativa = await iniciarTentativa(idNumber, token);
      console.log("✅ Nova tentativa criada:", novaTentativa);

      setResolucaoId(novaTentativa.id);
      setTentativaAtiva(novaTentativa);
      setRespostasSalvas({}); // Limpar respostas anteriores

      return novaTentativa.id;
    } catch (error) {
      console.error("❌ Erro ao iniciar tentativa:", error);
      throw error;
    }
  };

  const handleFinalizarTentativa =
    async (): Promise<FinalizarTentativaResponse> => {
      if (!session?.laravelToken) throw new Error("Usuário não autenticado");
      if (!resolucaoId)
        throw new Error("Nenhuma tentativa ativa para finalizar");

      const token = session.laravelToken;

      try {
        console.log("🏁 Finalizando tentativa:", resolucaoId);
        const resultado = await finalizarTentativa(resolucaoId, token);
        console.log("✅ Tentativa finalizada com sucesso:", resultado);

        // Limpar estado da tentativa
        setResolucaoId(null);
        setTentativaAtiva(null);
        setRespostasSalvas({});

        return resultado;
      } catch (err) {
        console.error("❌ Erro ao finalizar tentativa:", err);
        throw err;
      }
    };

  const refetch = async (): Promise<void> => {
    console.log("🔄 Refazendo fetch dos dados...");
    fetchDataRef.current = false;
    await fetchListaData();
  };

  // Formatar questões para o formato esperado
  const questionsFormatted = formatarQuestoes(questoes);

  // Verificação final de consistência
  const questaoIncompleta = questionsFormatted.find(
    (q) => q.dificuldade === undefined || q.dificuldade === null
  );

  if (questaoIncompleta) {
    console.error(
      "⚠️ Questão ainda sem dificuldade após formatação:",
      questaoIncompleta
    );
    // Corrigir em tempo de execução
    questionsFormatted.forEach((q) => {
      if (q.dificuldade === undefined || q.dificuldade === null) {
        q.dificuldade = 3;
      }
    });
  }

  console.log("📊 Estado final do hook:", {
    questoesFormatadas: questionsFormatted.length,
    resolucaoId,
    respostasSalvas: Object.keys(respostasSalvas).length,
    listaInfo: listaInfo?.nome,
    isLoading,
    error,
  });

  return {
    questionsFormatted,
    listaInfo,
    resolucaoId,
    respostasSalvas,
    isLoading,
    error,
    tentativaAtiva,
    handleIniciarTentativa,
    handleFinalizarTentativa,
    refetch,
  };
}
