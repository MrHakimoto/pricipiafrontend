//exercicios/listas-oficiais/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { getListaById } from '@/lib/questions/list';
import { iniciarTentativa, finalizarTentativa, getTentativaAtiva } from '@/lib/questions/tentativa';
import { Loader2 } from 'lucide-react';
import { Alternativa, Prova, Questao, ListaCompleta, Topico, Assunto, Frente, TopicoCompleto } from '@/types/list';
import type { QuestaoBase } from '@/types/questions';

// Tipo para as questões formatadas para o NavigationProvider
export type NavigationQuestion = QuestaoBase;

export default function ListaQuestionsPage() {
  const params = useParams();
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
    const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [topicos, setTopicos] = useState<TopicoCompleto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolucaoId, setResolucaoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [respostasSalvas, setRespostasSalvas] = useState<Record<number, number>>({});
   const [navbarHeight, setNavbarHeight] = useState(64);
  const navbarRef = useRef<HTMLElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  const listaId = params.id;


  useEffect(() => {
    // Buscar o navbar no DOM
    const navbar = document.querySelector('nav') as HTMLElement;
    navbarRef.current = navbar;

    const updateNavbarHeight = () => {
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    // Verificar se é mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Medir inicialmente
    updateNavbarHeight();
    checkIfMobile();

    // Observar mudanças (responsive, etc)
    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    if (navbar) {
      resizeObserver.observe(navbar);
    }

    window.addEventListener('resize', checkIfMobile);

    return () => {
      if (navbar) {
        resizeObserver.unobserve(navbar);
      }
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);


  // ✅ FETCH DATA COM ABORT CONTROLLER PARA EVITAR RACE CONDITIONS
  useEffect(() => {
    // ✅ Criar AbortController para cancelar requisições pendentes
    const abortController = new AbortController();
    let isMounted = true;

    const fetchListaData = async () => {
      // ✅ Verificar autenticação primeiro
      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated') {
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

      if (!listaId) {
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
        const idNumber = parseInt(Array.isArray(listaId) ? listaId[0] : listaId, 10);

        console.log('🔄 Buscando lista com ID:', idNumber);

        // ✅ Adicionar timeout para evitar requisições pendentes
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao carregar lista')), 10000)
        );

        const fetchPromise = Promise.all([
          getListaById(idNumber, token),
          getTentativaAtiva(idNumber, token)
        ]);

        const [dadosLista, tentativaExistente] = await Promise.race([fetchPromise, timeoutPromise]) as any;

        console.log('✅ Dados da lista:', dadosLista);
        console.log('✅ Tentativa existente:', tentativaExistente);

        // ✅ Verificar se o componente ainda está montado
        if (!isMounted) return;

        // ✅ Processar estrutura da resposta
        const assuntosDaLista: Assunto[] = dadosLista.lista_info?.assuntos || [];
        const frentesDaLista: Frente[] = dadosLista.lista_info?.frentes || [];
        const topicosDaLista: TopicoCompleto[] = dadosLista.lista_info?.topicos || [];
        let questoesData: Questao[] = [];
        let listaInfoData: ListaCompleta | null = null;

        // Verificar diferentes estruturas possíveis da resposta
        if (dadosLista && dadosLista.questoes && Array.isArray(dadosLista.questoes)) {
          // Estrutura 1: questões no nível raiz
          questoesData = dadosLista.questoes;
          console.log('📚 Questões carregadas do nível raiz:', questoesData.length);
        } else if (dadosLista && dadosLista.lista_info && Array.isArray(dadosLista.lista_info.questoes)) {
          // Estrutura 2: questões dentro de lista_info
          questoesData = dadosLista.lista_info.questoes;
          console.log('📚 Questões carregadas de lista_info:', questoesData.length);
        } else if (dadosLista && Array.isArray(dadosLista)) {
          // Estrutura 3: resposta é diretamente um array de questões
          questoesData = dadosLista;
          console.log('📚 Questões carregadas como array direto:', questoesData.length);
        } else if (dadosLista && dadosLista.data && Array.isArray(dadosLista.data)) {
          // Estrutura 4: questões dentro de data
          questoesData = dadosLista.data;
          console.log('📚 Questões carregadas de data:', questoesData.length);
        } else {
          console.warn('⚠️ Estrutura de resposta inesperada:', dadosLista);
          throw new Error('Estrutura de resposta da API inesperada');
        }

        // ✅ Verificação crítica: garantir que temos questões
        if (!questoesData || questoesData.length === 0) {
          throw new Error('Nenhuma questão encontrada na lista');
        }

        // ✅ Buscar informações da lista
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

        console.log('✅ Questões carregadas:', questoesData.length);
        console.log('✅ Informações da lista:', listaInfoData);

        // ✅ Atualizar estados apenas se montado
        if (isMounted) {
           setAssuntos(assuntosDaLista);
          setFrentes(frentesDaLista);
          setTopicos(topicosDaLista);
          setQuestoes(questoesData);
          setListaInfo(listaInfoData);


          if (tentativaExistente) {
            console.log('✅ Tentativa ativa encontrada:', tentativaExistente);
            setResolucaoId(tentativaExistente.id);

            // Extrair respostas já salvas
            const respostas: Record<number, number> = {};
            if (tentativaExistente.respostas && Array.isArray(tentativaExistente.respostas)) {
              tentativaExistente.respostas.forEach((resposta: any) => {
                respostas[resposta.questao_id] = resposta.alternativa_id;
              });
            }
            setRespostasSalvas(respostas);
            console.log('📝 Respostas carregadas:', Object.keys(respostas).length);
          } else {
            console.log('🆕 Nenhuma tentativa ativa - será criada na primeira resposta');
            setResolucaoId(null);
            setRespostasSalvas({});
          }
        }

      } catch (err: any) {
        console.error('❌ Erro ao carregar lista:', err);
        
        if (!isMounted) return;
        
        // ✅ Mensagens de erro específicas
        if (err.message === 'Timeout ao carregar lista') {
          setError("Tempo limite excedido ao carregar a lista. Tente novamente.");
        } else if (err.message.includes('Nenhuma questão encontrada')) {
          setError("Nenhuma questão encontrada nesta lista.");
        } else if (err.message.includes('Estrutura de resposta')) {
          setError("Erro no formato da resposta da API. Tente novamente.");
        } else {
          setError("Falha ao carregar a lista de exercícios. Tente novamente.");
        }
        
        // ✅ Limpar estados em caso de erro
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
      // ✅ Cleanup: cancelar requisições e marcar como não montado
      isMounted = false;
      abortController.abort();
      console.log('🧹 Cleanup: abortando requisições pendentes');
    };
  }, [listaId, session?.laravelToken, status]); // ✅ Dependências simplificadas

  // ✅ LOADING STATE
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

  // ✅ ERROR STATE - mostrar apenas se error !== null
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
              Tentar Novamente
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

  // ✅ VERIFICAÇÃO DE ESTADO INCONSISTENTE (sem questões mas também sem erro)
  // Esta verificação deve vir APÓS o loading e error states
  if (!questoes || questoes.length === 0) {
    console.warn('⚠️ Estado inconsistente: questoes vazio sem erro?', { 
      questoes, 
      listaInfo, 
      resolucaoId,
      respostasSalvas 
    });
    
    // ✅ Tentar recuperação automática se chegarmos aqui
    useEffect(() => {
      console.log('🔄 Tentando recuperação automática do estado inconsistente...');
      window.location.reload();
    }, []);
    
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Recarregando lista...</div>
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={32} />
          <p className="text-gray-400 text-sm">Estado inconsistente detectado. Recarregando automaticamente...</p>
        </div>
      </div>
    );
  }

  // ✅ PREPARAR AS QUESTÕES PARA O FORMATO ESPERADO PELO NAVIGATIONPROVIDER
  const questionsFormatted: QuestaoBase[] = questoes.map(questao => {
    // Formatar informações da prova
    const provaInfo = questao.prova ? {
      banca: {
        nome: questao.prova.nome || 'Banca não informada'
      },
      ano: questao.prova.ano || 0,
      sigla: questao.prova.sigla || undefined
    } : {
      banca: { nome: 'Banca não informada' },
      ano: 0,
      sigla: undefined
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
      gabarito_comentado_texto: questao.gabarito_comentado_texto || 'Gabarito comentado não disponível.',
      adaptado: !!questao.adaptado
    };

    // Verificar se todas as propriedades obrigatórias estão presentes
    if (!questaoFormatada.dificuldade) {
      console.warn(`⚠️ Questão ${questaoFormatada.id} sem dificuldade, usando valor padrão: 3`);
      questaoFormatada.dificuldade = 3;
    }

    return questaoFormatada;
  });

  // ✅ VERIFICAÇÃO FINAL
  const questaoIncompleta = questionsFormatted.find(q =>
    q.dificuldade === undefined ||
    q.dificuldade === null
  );

  if (questaoIncompleta) {
    console.error('❌ Questão ainda sem dificuldade:', questaoIncompleta);
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
    respostasSalvas: Object.keys(respostasSalvas).length,
    listaInfo: listaInfo?.nome
  });

  // ✅ HANDLE FUNCTIONS
  const handleIniciarTentativa = async (): Promise<number> => {
    if (!listaId) throw new Error("ID da lista não disponível");
    const token = session?.laravelToken!;
    try {
      console.log('🚀 Iniciando nova tentativa...');
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
      console.warn('⚠️ Nenhuma tentativa ativa para finalizar');
      return;
    }

    try {
      console.log('🏁 Finalizando tentativa:', resolucaoId);
      const resultado = await finalizarTentativa(resolucaoId, token);
      console.log('✅ Tentativa finalizada com sucesso:', resultado);

      // Aqui você pode redirecionar para uma página de resultados ou mostrar um modal
      alert('Tentativa finalizada com sucesso! Pontuação: ' + resultado.resolucao.score_final);

    } catch (err) {
      console.error('❌ Erro ao finalizar tentativa:', err);
      alert('Erro ao finalizar tentativa. Tente novamente.');
    }
  };

  // ✅ RENDERIZAÇÃO PRINCIPAL
  const isSimuladoOuProva = listaInfo?.tipo && ['simulado', 'prova'].includes(listaInfo.tipo);

  return (
    <NavigationProvider
      questions={questionsFormatted}
      respostasSalvas={respostasSalvas}
      isSimuladoOuProva={!!isSimuladoOuProva}
    >
     <div 
        className="flex bg-[#00091A] overflow-hidden"
        style={{ 
          height: `calc(100vh - ${navbarHeight}px)`,
          paddingTop: isMobile ? '60px' : '0' // Adiciona padding no topo para mobile
        }}
      >
        {/* Sidebar Esquerda */}
     
          
          <NavigationSidebar 
            assuntos={assuntos}
            frentes={frentes}
            topicos={topicos}
            listaInfo={listaInfo ?? undefined}
            resolucaoId={resolucaoId}
            onFinalizarTentativa={handleFinalizarTentativa}
            navbarHeight={navbarHeight}
          />
        
       

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