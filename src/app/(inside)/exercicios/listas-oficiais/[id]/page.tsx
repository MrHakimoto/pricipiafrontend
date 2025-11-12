'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { getListaById } from '@/lib/questions/list';
import { Loader2 } from 'lucide-react';

// Tipos baseados na sua resposta da API
type Alternativa = {
  id: number;
  questao_id: number;
  texto: string;
  ordem: number;
  letra: string;
  created_at: string;
  updated_at: string;
};

type Prova = {
  id: number;
  nome: string;
  sigla: string;
  ano: number;
  banca_id: number;
  observacoes: string | null;
  foto_url: string | null;
  elegivel: boolean;
  created_at: string;
  updated_at: string;
} | null; // Adicionei null aqui

type Questao = {
  id: number;
  prova_id: number;
  alternativa_correta_id: number;
  enunciado: string;
  gabarito_comentado_texto: string;
  gabarito_video: string;
  minutagem: number | null;
  dificuldade: number;
  created_at: string;
  updated_at: string;
  pivot: {
    lista_id: number;
    questao_id: number;
    created_at: string;
    updated_at: string;
  };
  alternativas: Alternativa[];
  prova: Prova; // Agora pode ser null
};

// Tipo para a lista completa
type ListaCompleta = {
  id: number;
  nome: string;
  descricao?: string;
};

export default function ListaQuestionsPage() {
  const params = useParams();
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const listaId = params.id;

  useEffect(() => {
    const fetchListaData = async () => {
      if (status === 'authenticated' && session?.laravelToken && listaId) {
        try {
          setIsLoading(true);
          const token = session.laravelToken;
          const id = Array.isArray(listaId) ? listaId[0] : listaId;

          console.log('Buscando lista com ID:', id);
          
          const response = await getListaById(id, token);
          console.log('Resposta da API:', response);
          
          if (Array.isArray(response)) {
            setQuestoes(response);
            setListaInfo({
              id: parseInt(id),
              nome: `Lista ${id}`,
              descricao: 'Lista de exercícios'
            });
          } else if (response.data && Array.isArray(response.data)) {
            setQuestoes(response.data);
            setListaInfo({
              id: parseInt(id),
              nome: `Lista ${id}`,
              descricao: 'Lista de exercícios'
            });
          } else {
            console.warn('Estrutura de resposta inesperada:', response);
            setQuestoes([]);
          }
          
        } catch (err) {
          console.error('Erro detalhado:', err);
          setError("Falha ao carregar a lista de exercícios.");
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setError("Você precisa estar logado para acessar esta lista.");
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
      <div className="flex justify-center items-center h-screen bg-[#0a0f1c]">
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
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">{error}</div>
        </div>
      </div>
    );
  }

  // Se não há questões
  if (!questoes || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">Nenhuma questão encontrada</div>
        </div>
      </div>
    );
  }

  // Prepara as questões para o formato esperado pelo componente
  const questionsFormatted = questoes.map(questao => {
    // Verifica se prova existe e tem as propriedades necessárias
    const provaInfo = questao.prova ? {
      banca: { 
        nome: questao.prova.sigla || questao.prova.nome || 'Banca não informada'
      },
      ano: questao.prova.ano
    } : {
      banca: { nome: '' },
      ano: 0
    };

    return {
      id: questao.id,
      enunciado: questao.enunciado,
      alternativa_correta_id: questao.alternativa_correta_id,
      alternativas: questao.alternativas.map(alt => ({
        id: alt.id,
        letra: alt.letra,
        texto: alt.texto
      })),
      topicos: [], // A API não retorna tópicos
      prova: provaInfo,
      gabarito_video: questao.gabarito_video,
      gabarito_comentado_texto: questao.gabarito_comentado_texto
    };
  });

  return (
    <NavigationProvider questions={questionsFormatted}>
      <div className="flex h-screen bg-[#0a0f1c] overflow-hidden">
        {/* Sidebar Esquerda */}
        <NavigationSidebar listaInfo={listaInfo} />
        
        {/* Painel de Questões (Direita) */}
        <QuestionsPanel questions={questionsFormatted} />
      </div>
    </NavigationProvider>
  );
}