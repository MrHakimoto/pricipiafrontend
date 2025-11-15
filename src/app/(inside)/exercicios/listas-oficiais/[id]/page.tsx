//exercicios/listas-oficiais/[id]/page.tsx
'use client';

import { useEffect, useState, useRef  } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { getListaById } from '@/lib/questions/list';
import { iniciarTentativa, finalizarTentativa, getTentativaAtiva } from '@/lib/questions/tentativa';
import { Loader2 } from 'lucide-react';
import { Alternativa, Prova, Questao, ListaCompleta, Topico } from '@/types/list';
import type { QuestaoBase } from '@/types/questions';

// Tipo para as questões formatadas para o NavigationProvider
export type NavigationQuestion = QuestaoBase;


export default function ListaQuestionsPage() {
  const params = useParams();
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolucaoId, setResolucaoId] = useState<number | null>(null);
  const [tentativaIniciada, setTentativaIniciada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tentativaAtiva, setTentativaAtiva] = useState<any>(null);
  const [respostasSalvas, setRespostasSalvas] = useState<Record<number, number>>({});

  const listaId = params.id;


   const fetchDataRef = useRef(false);


    // ✅ IMPEDIR EXECUÇÕES MÚLTIPLAS
    



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
          const idNumber = parseInt(Array.isArray(listaId) ? listaId[0] : listaId, 10);

          console.log('Buscando lista com ID:', idNumber);
          const [dadosLista, tentativaExistente] = await Promise.all([
            getListaById(idNumber, token),
            getTentativaAtiva(idNumber, token)
          ]);
          console.log(' Dados da lista:', dadosLista);
          console.log(' Tentativa existente:', tentativaExistente);

          // CORREÇÃO: Acessar a estrutura correta da resposta
          let questoesData: Questao[] = [];
          let listaInfoData: ListaCompleta | null = null;

          // Verificar diferentes estruturas possíveis da resposta
          if (dadosLista && dadosLista.questoes && Array.isArray(dadosLista.questoes)) {
            // Estrutura 1: questões no nível raiz
            questoesData = dadosLista.questoes;
            console.log('Questões carregadas do nível raiz:', questoesData.length);
          } else if (dadosLista && dadosLista.lista_info && Array.isArray(dadosLista.lista_info.questoes)) {
            // Estrutura 2: questões dentro de lista_info
            questoesData = dadosLista.lista_info.questoes;
            console.log('Questões carregadas de lista_info:', questoesData.length);
          } else if (dadosLista && Array.isArray(dadosLista)) {
            // Estrutura 3: resposta é diretamente um array de questões
            questoesData = dadosLista;
            console.log('Questões carregadas como array direto:', questoesData.length);
          } else if (dadosLista && dadosLista.data && Array.isArray(dadosLista.data)) {
            // Estrutura 4: questões dentro de data
            questoesData = dadosLista.data;
            console.log('Questões carregadas de data:', questoesData.length);
          } else {
            console.warn('Estrutura de resposta inesperada:', dadosLista);
            setQuestoes([]);
            setIsLoading(false);
            return;
          }

          // Buscar informações da lista
          if (dadosLista.lista_info) {
            listaInfoData = {
              id: dadosLista.lista_info.id || idNumber,
              nome: dadosLista.lista_info.name || dadosLista.lista_info.nome || `Lista ${idNumber}`,
              descricao: dadosLista.lista_info.descricao || 'Lista de exercícios',
              total_time_in_seconds: dadosLista.lista_info.total_time_in_seconds || 0,
              user_id: dadosLista.lista_info.user_id,
              is_public: dadosLista.lista_info.is_public,
              time: dadosLista.lista_info.time,
              tipo: dadosLista.lista_info.tipo,
              created_at: dadosLista.lista_info.created_at,
              updated_at: dadosLista.lista_info.updated_at,
              average_difficulty: dadosLista.lista_info.average_difficulty,
              most_frequent_assunto: dadosLista.lista_info.most_frequent_assunto
            };
          } else if (dadosLista.name) {
            // Fallback: se não houver lista_info, mas houver name no nível raiz
            listaInfoData = {
              id: idNumber,
              nome: dadosLista.name || `Lista ${idNumber}`,
              descricao: dadosLista.descricao || 'Lista de exercícios',
              total_time_in_seconds: dadosLista.total_time_in_seconds || 0
            };
          } else {
            // Fallback final
            listaInfoData = {
              id: idNumber,
              nome: `Lista ${idNumber}`,
              descricao: 'Lista de exercícios',
              total_time_in_seconds: 0
            };
          }

          console.log('Questões carregadas:', questoesData.length);
          console.log('Informações da lista:', listaInfoData);

          setQuestoes(questoesData);
          setListaInfo(listaInfoData);



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


  const handleIniciarTentativa = async (): Promise<number> => {
    if (!listaId) throw new Error("ID da lista não disponível");
    const token = session?.laravelToken!;
    try {
      console.log('🎯 Iniciando nova tentativa...');
      const idNumber = parseInt(Array.isArray(listaId) ? listaId[0] : listaId, 10);
      const novaTentativa = await iniciarTentativa(idNumber, token);
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

      // Aqui você pode redirecionar para uma página de resultados ou mostrar um modal
      alert('Tentativa finalizada com sucesso! Pontuação: ' + resultado.resolucao.score_final);

    } catch (err) {
      console.error('Erro ao finalizar tentativa:', err);
      alert('Erro ao finalizar tentativa. Tente novamente.');
    }
  };



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
    // Formatar informações da prova
    const provaInfo = questao.prova ? {
      banca: {
        nome: questao.prova.sigla || questao.prova.nome || 'Banca não informada'
      },
      ano: questao.prova.ano || 0
    } : {
      banca: { nome: 'Banca não informada' },
      ano: 0
    };

    // Formatar tópicos - garantir que seja um array de objetos com id e nome
    const topicosFormatados = Array.isArray(questao.topicos)
      ? questao.topicos.map((topico: Topico) => ({
        id: topico.id,
        nome: topico.nome
      }))
      : [];

    // Formatar alternativas
    const alternativasFormatadas = Array.isArray(questao.alternativas)
      ? questao.alternativas.map((alt: Alternativa) => ({
        id: alt.id,
        letra: alt.letra,
        texto: alt.texto
      }))
      : [];

    // ✅ GARANTIR que todas as propriedades obrigatórias estejam presentes
    const questaoFormatada: QuestaoBase = {
      id: questao.id,
      enunciado: questao.enunciado || 'Enunciado não disponível',
      dificuldade: questao.dificuldade || 3, // Default para dificuldade média
      alternativa_correta_id: questao.alternativa_correta_id,
      alternativas: alternativasFormatadas,
      topicos: topicosFormatados,
      prova: provaInfo,
      gabarito_video: questao.gabarito_video || null,
      gabarito_comentado_texto: questao.gabarito_comentado_texto || 'Gabarito comentado não disponível.'
    };

    // Verificar se todas as propriedades obrigatórias estão presentes
    if (!questaoFormatada.dificuldade) {
      console.warn(`Questão ${questaoFormatada.id} sem dificuldade, usando valor padrão: 3`);
      questaoFormatada.dificuldade = 3;
    }

    return questaoFormatada;
  });

  // Verificação final
  const questaoIncompleta = questionsFormatted.find(q =>
    q.dificuldade === undefined ||
    q.dificuldade === null
  );

  if (questaoIncompleta) {
    console.error('Questão ainda sem dificuldade:', questaoIncompleta);
    // Corrigir em tempo de execução
    questionsFormatted.forEach(q => {
      if (q.dificuldade === undefined || q.dificuldade === null) {
        q.dificuldade = 3;
      }
    });
  }

  console.log('📊 Estado final:', {
    questoesFormatadas: questionsFormatted.length,
    resolucaoId,
    respostasSalvas,
    listaInfo: listaInfo?.nome
  });

  const isSimuladoOuProva = listaInfo?.tipo && ['simulado', 'prova'].includes(listaInfo.tipo);

  return (
    <NavigationProvider
      questions={questionsFormatted}
      respostasSalvas={respostasSalvas}
      isSimuladoOuProva={!!isSimuladoOuProva}
    >
      <div className="flex h-[calc(100vh-145px)] bg-[#00091A] overflow-hidden">
        {/* Sidebar Esquerda */}
        <div className="w-80 flex-shrink-0">
          <NavigationSidebar listaInfo={listaInfo ?? undefined}
            resolucaoId={resolucaoId}
            onFinalizarTentativa={handleFinalizarTentativa}
          />
        </div>

        {/* Painel de Questões (Direita) */}
        <QuestionsPanel
          className="flex-1 overflow-y-auto"
          questions={questionsFormatted}
          resolucaoId={resolucaoId}
          respostasSalvas={respostasSalvas}
          onIniciarTentativa={handleIniciarTentativa}
          listaId={listaInfo?.id}
          listaTipo={listaInfo?.tipo}
        />

        {/* DEBUG - Apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div
            className="fixed bottom-3 right-3 bg-black/80 text-white p-3 rounded-md border border-gray-700 text-xs z-[1000] font-mono"
          >
            <div className="font-bold mb-1">DEBUG:</div>
            <div>Questões: {questionsFormatted.length}</div>
            <div>
              Com Dificuldade:{' '}
              {questionsFormatted.filter(
                (q) => q.dificuldade !== undefined && q.dificuldade !== null
              ).length}
            </div>
            <div>Lista Info: {listaInfo ? 'Sim' : 'Não'}</div>
            <div>Tentativa ID: {resolucaoId || 'Não iniciada'}</div>
            <div>Status: {status}</div>
          </div>
        )}
      </div>
    </NavigationProvider>
  );
}