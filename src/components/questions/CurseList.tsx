// componentes/questions/CurseList.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { getListaById } from '@/lib/questions/list';
import { Loader2 } from 'lucide-react';
import { Alternativa, Prova, Questao, ListaCompleta, Topico } from '@/types/list';
import type { QuestaoBase } from '@/types/questions';

interface ListaCursePageProps {
  idList: number;
}

// Tipo para as questões formatadas para o NavigationProvider
export type NavigationQuestion = QuestaoBase;

export default function ListaCursePage({ idList }: ListaCursePageProps) {
  const params = useParams();
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const listaId = idList;

  useEffect(() => {
    const fetchListaData = async () => {
      if (status === 'authenticated' && session?.laravelToken && listaId) {
        try {
          setIsLoading(true);
          setError(null);
          const token = session.laravelToken;

          console.log('Buscando lista com ID:', listaId);
          const response = await getListaById(listaId, token);
          console.log('Resposta completa da API:', response);
          
          // CORREÇÃO: Acessar a estrutura correta da resposta
          let questoesData: Questao[] = [];
          let listaInfoData: ListaCompleta | null = null;

          // Verificar diferentes estruturas possíveis da resposta
          if (response && response.questoes && Array.isArray(response.questoes)) {
            // Estrutura 1: questões no nível raiz
            questoesData = response.questoes;
            console.log('Questões carregadas do nível raiz:', questoesData.length);
          } else if (response && response.lista_info && Array.isArray(response.lista_info.questoes)) {
            // Estrutura 2: questões dentro de lista_info
            questoesData = response.lista_info.questoes;
            console.log('Questões carregadas de lista_info:', questoesData.length);
          } else if (response && Array.isArray(response)) {
            // Estrutura 3: resposta é diretamente um array de questões
            questoesData = response;
            console.log('Questões carregadas como array direto:', questoesData.length);
          } else {
            console.warn('Estrutura de resposta inesperada:', response);
            setQuestoes([]);
            setIsLoading(false);
            return;
          }

          // Buscar informações da lista
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
            // Fallback: se não houver lista_info, mas houver name no nível raiz
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
  }, [listaId, session, status]);

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

    return {
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
  });

  console.log('Questões formatadas:', questionsFormatted.length);
  console.log('Informações da lista:', listaInfo);

  // Verificar se todas as questões têm a propriedade 'dificuldade'
  const questoesComDificuldade = questionsFormatted.filter(q => q.dificuldade !== undefined);
  console.log('Questões com dificuldade definida:', questoesComDificuldade.length);

  return (
    <NavigationProvider questions={questionsFormatted}>
    <div className="flex h-[calc(100vh-245px)] bg-[#00091A] overflow-hidden">
      {/* Sidebar */}
      <NavigationSidebar listaInfo={listaInfo ?? undefined} />
      
      {/* Painel de Questões */}
      <QuestionsPanel className="flex-1 overflow-y-auto" questions={questionsFormatted} />
    </div>

      {/* DEBUG - Remova em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          zIndex: 1000,
          fontSize: '12px',
          borderRadius: '5px',
          border: '1px solid #333'
        }}>
          <div><strong>DEBUG:</strong></div>
          <div>Questões: {questoes.length}</div>
          <div>Lista Info: {listaInfo ? 'Sim' : 'Não'}</div>
          <div>Status: {status}</div>
        </div>
      )}
    </NavigationProvider>
  );
}