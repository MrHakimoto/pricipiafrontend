// componentes/questions/CurseList.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { getListaById } from '@/lib/questions/list';
import { iniciarTentativa, finalizarTentativa, getTentativaAtiva } from '@/lib/questions/tentativa'; // ✅ Adicione estas importações
import { Loader2 } from 'lucide-react';
import { Alternativa, Prova, Questao, ListaCompleta, Topico } from '@/types/list';
import type { QuestaoBase } from '@/types/questions';

interface ListaCursePageProps {
  idList: number;
}

export type NavigationQuestion = QuestaoBase;

export default function ListaCursePage({ idList }: ListaCursePageProps) {
  const params = useParams();
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ✅ ADICIONE ESTES ESTADOS para o sistema de tentativas
  const [resolucaoId, setResolucaoId] = useState<number | null>(null);
  const [respostasSalvas, setRespostasSalvas] = useState<Record<number, number>>({});
  const [tentativaAtiva, setTentativaAtiva] = useState<any>(null);

  const listaId = idList;
  const fetchDataRef = useRef(false); // ✅ Para evitar loops

  useEffect(() => {
    if (fetchDataRef.current) {
      console.log('🛑 fetchListaData já foi executado, ignorando...');
      return;
    }

    const fetchListaData = async () => {
      if (status === 'authenticated' && session?.laravelToken && listaId) {
        try {
          fetchDataRef.current = true;
          setIsLoading(true);
          setError(null);
          const token = session.laravelToken;

          console.log('Buscando lista com ID:', listaId);

          // ✅ BUSCAR EM PARALELO: lista + tentativa ativa
          const [response, tentativaExistente] = await Promise.all([
            getListaById(listaId, token),
            getTentativaAtiva(listaId, token) // ✅ Busca tentativa ativa
          ]);

          console.log('Resposta completa da API:', response);
          console.log('Tentativa existente:', tentativaExistente);

          let questoesData: Questao[] = [];
          let listaInfoData: ListaCompleta | null = null;

          // Processar questões (seu código existente)
          if (response && response.questoes && Array.isArray(response.questoes)) {
            questoesData = response.questoes;
          } else if (response && response.lista_info && Array.isArray(response.lista_info.questoes)) {
            questoesData = response.lista_info.questoes;
          } else if (response && Array.isArray(response)) {
            questoesData = response;
          } else {
            console.warn('Estrutura de resposta inesperada:', response);
            setQuestoes([]);
            setIsLoading(false);
            return;
          }

          // Processar info da lista (seu código existente)
          if (response.lista_info) {
            listaInfoData = {
              id: response.lista_info.id || listaId,
              nome: response.lista_info.name || response.lista_info.nome || `Lista ${listaId}`,
              descricao: response.lista_info.descricao || 'Lista de exercícios',
              total_time_in_seconds: response.lista_info.total_time_in_seconds || 0,
              user_id: response.lista_info.user_id,
              is_public: response.lista_info.is_public,
              time: response.lista_info.time,
              tipo: response.lista_info.tipo,
              created_at: response.lista_info.created_at,
              updated_at: response.lista_info.updated_at,
              average_difficulty: response.lista_info.average_difficulty,
              most_frequent_assunto: response.lista_info.most_frequent_assunto
            };
          } else if (response.name) {
            listaInfoData = {
              id: listaId,
              nome: response.name || `Lista ${listaId}`,
              descricao: response.descricao || 'Lista de exercícios',
              total_time_in_seconds: response.total_time_in_seconds || 0
            };
          }

          console.log('Questões carregadas:', questoesData.length);
          console.log('Informações da lista:', listaInfoData);

          setQuestoes(questoesData);
          setListaInfo(listaInfoData);

          // ✅ PROCESSAR TENTATIVA ATIVA (igual ao ListaQuestionsPage)
          if (tentativaExistente) {
            console.log('✅ Tentativa ativa encontrada:', tentativaExistente);
            setResolucaoId(tentativaExistente.id);
            setTentativaAtiva(tentativaExistente);

            // Extrair respostas já salvas
            const respostas: Record<number, number> = {};
            if (tentativaExistente.respostas && Array.isArray(tentativaExistente.respostas)) {
              tentativaExistente.respostas.forEach((resposta: any) => {
                respostas[resposta.questao_id] = resposta.alternativa_id;
              });
            }
            setRespostasSalvas(respostas);
            console.log('📝 Respostas carregadas:', respostas);

          } else {
            console.log('🆕 Nenhuma tentativa ativa - será criada na primeira resposta');
            setResolucaoId(null);
            setTentativaAtiva(null);
            setRespostasSalvas({});
          }

        } catch (err) {
          console.error('Erro detalhado ao carregar lista:', err);
          setError("Falha ao carregar a lista de exercícios. Tente novamente.");
          fetchDataRef.current = false; // Permite nova tentativa
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setError("Você precisa estar logado para acessar esta lista.");
        setIsLoading(false);
      } else if (!listaId) {
        setError("ID da lista não fornecido.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    fetchListaData();

    return () => {
      fetchDataRef.current = false;
    };
  }, [listaId]);

  // ✅ ADICIONE AS FUNÇÕES DE TENTATIVA (igual ao ListaQuestionsPage)
  const handleIniciarTentativa = async (): Promise<number> => {
    if (!listaId) throw new Error("ID da lista não disponível");
    const token = session?.laravelToken!;
    try {
      console.log('🎯 Iniciando nova tentativa...');
      const novaTentativa = await iniciarTentativa(listaId, token);
      console.log('✅ Nova tentativa criada:', novaTentativa);

      setResolucaoId(novaTentativa.id);
      return novaTentativa.id;
    } catch (error) {
      console.error('❌ Erro ao iniciar tentativa:', error);
      throw error;
    }
  };

  const handleFinalizarTentativa = async () => {
    const token = session?.laravelToken!;

    if (!resolucaoId) {
      console.warn('Nenhuma tentativa ativa para finalizar');
      return;
    }

    try {
      console.log('Finalizando tentativa:', resolucaoId);
      const resultado = await finalizarTentativa(resolucaoId, token);
      console.log('Tentativa finalizada com sucesso:', resultado);

      alert('Tentativa finalizada com sucesso! Pontuação: ' + resultado.resolucao.score_final);

    } catch (err) {
      console.error('Erro ao finalizar tentativa:', err);
      alert('Erro ao finalizar tentativa. Tente novamente.');
    }
  };

  // Loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#00091A]">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white text-lg">Carregando lista...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Se não há questões
  if (!questoes || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Nenhuma questão encontrada nesta lista</div>
          <p className="text-gray-400 mb-6">A lista pode estar vazia ou ocorreu um problema ao carregar as questões.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Prepara as questões para o formato esperado pelo NavigationProvider
  const questionsFormatted: QuestaoBase[] = questoes.map(questao => {
    const provaInfo = questao.prova ? {
      banca: {
        nome: questao.prova.nome || 'Banca não informada' // ⚠ manter nome real
      },
      ano: questao.prova.ano || 0,
      sigla: questao.prova.sigla || undefined // ✅ incluir sigla
    } : {
      banca: { nome: 'Banca não informada' },
      ano: 0,
      sigla: undefined
    };

    const topicosFormatados = Array.isArray(questao.topicos)
      ? questao.topicos.map((topico: Topico) => ({
        id: topico.id,
        nome: topico.nome
      }))
      : [];

    const alternativasFormatadas = Array.isArray(questao.alternativas)
      ? questao.alternativas.map((alt: Alternativa) => ({
        id: alt.id,
        letra: alt.letra,
        texto: alt.texto
      }))
      : [];

    return {
      id: questao.id,
      enunciado: questao.enunciado || 'Enunciado não disponível',
      dificuldade: questao.dificuldade || 3,
      alternativa_correta_id: questao.alternativa_correta_id,
      alternativas: alternativasFormatadas,
      topicos: topicosFormatados,
      prova: provaInfo,
      adaptado: !!questao.adaptado,
      gabarito_video: questao.gabarito_video || null,
      gabarito_comentado_texto: questao.gabarito_comentado_texto || 'Gabarito comentado não disponível.'
    };
  });

  console.log('📊 CurseList Estado final:', {
    questoesFormatadas: questionsFormatted.length,
    resolucaoId,
    respostasSalvas: Object.keys(respostasSalvas).length,
    listaInfo: listaInfo?.nome,
    tipo: listaInfo?.tipo
  });

  // ✅ VERIFICA SE É SIMULADO/PROVA (igual ao ListaQuestionsPage)
  const isSimuladoOuProva = Boolean(
    listaInfo?.tipo && ['simulado', 'prova'].includes(listaInfo.tipo)
  );

  return (
    // ✅ ATUALIZE O NavigationProvider com todas as props necessárias
    <NavigationProvider
      questions={questionsFormatted}
      respostasSalvas={respostasSalvas}
      isSimuladoOuProva={isSimuladoOuProva}
    >
      <div className="flex h-[calc(100vh-245px)] bg-[#00091A] overflow-hidden">
        {/* ✅ ATUALIZE O NavigationSidebar com todas as props */}
        <NavigationSidebar
          listaInfo={listaInfo ?? undefined}
          resolucaoId={resolucaoId}
          onFinalizarTentativa={handleFinalizarTentativa}
        />

        {/* ✅ ATUALIZE O QuestionsPanel com todas as props */}
        <QuestionsPanel
          className="flex-1 overflow-y-auto"
          questions={questionsFormatted}
          resolucaoId={resolucaoId}
          respostasSalvas={respostasSalvas}
          onIniciarTentativa={handleIniciarTentativa}
          listaId={listaInfo?.id}
          listaTipo={listaInfo?.tipo}
        />
      </div>

      {/* DEBUG - Apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-3 right-3 bg-black/80 text-white p-3 rounded-md border border-gray-700 text-xs z-[1000] font-mono">
          <div className="font-bold mb-1">DEBUG CurseList:</div>
          <div>Questões: {questoes.length}</div>
          <div>Tentativa ID: {resolucaoId || 'Não iniciada'}</div>
          <div>Tipo: {listaInfo?.tipo || 'normal'}</div>
          <div>É simulado/prova: {isSimuladoOuProva ? 'Sim' : 'Não'}</div>
          <div>Status: {status}</div>
        </div>
      )}
    </NavigationProvider>
  );
}