'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { NavigationProvider } from '@/contexts/NavigationContext';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { NavigationSidebar } from '@/components/questions/NavigationSidebar';
import { getListaById } from '@/lib/questions/list';
import { Loader2 } from 'lucide-react';
import { Alternativa, Prova, Questao, ListaCompleta } from '@/types/list';

interface ListaCursePageProps {
  idList: number;
}

export default function ListaCursePage({ idList }: ListaCursePageProps) {
  const params = useParams();
  const { data: session, status } = useSession();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [listaInfo, setListaInfo] = useState<ListaCompleta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // CORREÇÃO: Usar o idList recebido como prop
  const listaId = idList;

  useEffect(() => {
    const fetchListaData = async () => {
      if (status === 'authenticated' && session?.laravelToken && listaId) {
        try {
          setIsLoading(true);
          setError(null); // Limpar erros anteriores
          const token = session.laravelToken;

          console.log('Buscando lista com ID:', listaId);
          const response = await getListaById(listaId, token);
          console.log('Resposta da API:', response);
          
          // CORREÇÃO: Melhor tratamento da resposta
          let questoesData: Questao[] = [];
          
          if (Array.isArray(response)) {
            questoesData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            questoesData = response.data;
          } else if (response && Array.isArray(response.questoes)) {
            questoesData = response.questoes;
          } else {
            console.warn('Estrutura de resposta inesperada:', response);
            setQuestoes([]);
            return;
          }

          setQuestoes(questoesData);
          console.log( response.lista_info.total_time_in_seconds, "VEREMOPSSSSSSSS")
          setListaInfo({
            id: listaId,
            nome: response.name || response.lista_info.name || `Lista ${listaId}`,
            descricao: response.descricao || 'Lista de exercícios',
            total_time_in_seconds: response.lista_info.total_time_in_seconds
          });
          
        } catch (err) {
          console.error('Erro detalhado:', err);
          setError("Falha ao carregar a lista de exercícios.");
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
  }, [listaId, session, status]); // CORREÇÃO: Dependência correta


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
      ano: questao.prova.ano || 0
    } : {
      banca: { nome: '' },
      ano: 0
    };

    return {
      id: questao.id,
      enunciado: questao.enunciado,
      dificuldade: questao.dificuldade,
      alternativa_correta_id: questao.alternativa_correta_id,
      alternativas: questao.alternativas?.map(alt => ({
        id: alt.id,
        letra: alt.letra,
        texto: alt.texto
      })) || [],
      topicos: Array.isArray(questao.topicos) ? questao.topicos : [], // Usar tópicos da API se disponíveis
      prova: provaInfo,
      gabarito_video: questao.gabarito_video,
      gabarito_comentado_texto: questao.gabarito_comentado_texto
    };
  });

  return (
    <NavigationProvider questions={questionsFormatted}>
      <div className="flex h-[calc(100vh-245px)] bg-[#00091A] overflow-hidden">
        {/* Sidebar Esquerda */}
        <NavigationSidebar listaInfo={listaInfo} />
        
        {/* Painel de Questões (Direita) */}
        <QuestionsPanel questions={questionsFormatted} />
      </div>
    </NavigationProvider>
  );
}