"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/spinnerLoading";
import { FilterPanel } from "@/components/Panel/PanelFilter";
import { ModelQuestions } from "@/components/questions/ModelQuestions";
import { getFilterOptionsByIds, getFilteredQuestions, getAssuntosByFrentes, getTopicosByAssuntos } from "@/lib/filtra";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";

 // faz a requisição pra essa   Route::post('/questoes/{questao}/responder-avulsa', [ResolucaoController::class, 'responderAvulsa']);


export type FilterPanelProps = {
  initialSelectedFronts?: any[];
  initialSelectedExams?: any[];
  initialSelectedSubjects?: any[];
  initialSelectedTopics?: any[];
  initialSelectedYears?: { id: number; nome: string }[];
  initialWantsComments?: boolean;
  initialQuestionStatus?: string;
  initialCorrectStatus?: string;
  subjectOptions?: any[];
  topicOptions?: any[];
};

type FilterOption = { id: number; nome: string };

// Interface para os filtros do caminho (path)
interface PathFilters {
  frente?: string[];
  prova?: string[];
  assunto?: string[];
  topico?: string[];
  ano?: string[];
}

// Interface para os filtros de consulta (query) - COM ASSINATURA DE ÍNDICE
interface QueryFilters {
  [key: string]: string | undefined;
  com_comentarios?: string;
  status?: string;
  acerto?: string;
}

// Hook personalizado para gerenciar o estado da busca
const useSearchResults = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [initialFilters, setInitialFilters] = useState<Partial<FilterPanelProps>>({});
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrai filtros do caminho da URL
  const extractPathFilters = (): PathFilters => {
    const pathFilters: PathFilters = {};
    const slug = Array.isArray(params.slug) ? params.slug : [];
    
    for (let i = 0; i < slug.length; i += 2) {
      const key = slug[i];
      const values = slug[i + 1]?.split(',') || [];
      
      if (key && ['frente', 'prova', 'assunto', 'topico', 'ano'].includes(key)) {
        pathFilters[key as keyof PathFilters] = values;
      }
    }
    
    return pathFilters;
  };

  // Extrai filtros dos parâmetros de consulta
  const extractQueryFilters = (): QueryFilters => {
    return Object.fromEntries(searchParams.entries()) as QueryFilters;
  };

  // Processa anos a partir dos filtros do caminho
  const processYears = (pathFilters: PathFilters) => {
    const yearIds = pathFilters.ano || [];
    return yearIds.map(id => ({
      id: Number(id),
      nome: String(id)
    }));
  };

  // Busca dados iniciais
  const fetchInitialData = async (token: string, pathFilters: PathFilters, queryFilters: QueryFilters) => {
    try {
      // Busca dados básicos em paralelo
      const [fronts, exams, subjects, topics, fetchedQuestions] = await Promise.all([
        getFilterOptionsByIds('frentes', pathFilters.frente, token),
        getFilterOptionsByIds('provas', pathFilters.prova, token),
        getFilterOptionsByIds('assuntos', pathFilters.assunto, token),
        getFilterOptionsByIds('topicos', pathFilters.topico, token),
        getFilteredQuestions({ ...pathFilters }, queryFilters as { [key: string]: string }, token),
      ]);

      // Busca opções dependentes em paralelo
      const [subjectOptions, topicOptions] = await Promise.all([
        getAssuntosByFrentes(pathFilters.frente?.join(','), token),
        getTopicosByAssuntos(pathFilters.assunto?.join(','), token),
      ]);

      const initialSelectedYears = processYears(pathFilters);

      return {
        fronts,
        exams,
        subjects,
        topics,
        fetchedQuestions,
        subjectOptions,
        topicOptions,
        initialSelectedYears,
      };
    } catch (err) {
      throw new Error(`Falha ao carregar dados da busca: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  useEffect(() => {
    const loadSearchResults = async () => {
      // Aguarda autenticação e parâmetros estarem disponíveis
      if (status === 'loading' || !params) return;
      
      // Verifica se está autenticado
      if (status !== 'authenticated' || !session?.laravelToken) {
        setError("Usuário não autenticado");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token = session.laravelToken;
        const pathFilters = extractPathFilters();
        const queryFilters = extractQueryFilters();

        const {
          fronts,
          exams,
          subjects,
          topics,
          fetchedQuestions,
          subjectOptions,
          topicOptions,
          initialSelectedYears,
        } = await fetchInitialData(token, pathFilters, queryFilters);

        // Atualiza estado com os dados obtidos
        setInitialFilters({
          initialSelectedFronts: fronts,
          initialSelectedExams: exams,
          initialSelectedSubjects: subjects,
          initialSelectedTopics: topics,
          initialSelectedYears,
          initialWantsComments: queryFilters.com_comentarios === 'true',
          initialQuestionStatus: queryFilters.status || 'all',
          initialCorrectStatus: queryFilters.acerto || 'all',
          subjectOptions,
          topicOptions,
        });

        setQuestions(fetchedQuestions?.data || []);

      } catch (err) {
        console.error("Erro ao carregar resultados da busca:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    loadSearchResults();
  }, [session, status, params, searchParams]);

  return {
    initialFilters,
    questions,
    isLoading: isLoading || status === 'loading',
    error,
  };
};

// Componente de Loading
const SearchResultsLoading = () => (
  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <LoadingSpinner className="p-2 h-70 w-70" />
  </div>
);

// Componente de Erro
const SearchResultsError = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-[#00091A] flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Erro</h2>
      <p className="text-white">{error}</p>
    </div>
  </div>
);

// Componente Principal
export default function SearchResultsPage() {
  const { initialFilters, questions, isLoading, error } = useSearchResults();

  // Estados de loading e erro
  if (isLoading) {
    return <SearchResultsLoading />;
  }

  if (error) {
    return <SearchResultsError error={error} />;
  }

  return (
    <div className="min-h-screen bg-[#00091A]">
      <ExercisesHeader />
      <div className="max-w-6xl mx-auto mt-5 px-4">
        <FilterPanel {...initialFilters} />
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Resultados da Busca ({questions.length} questão{questions.length !== 1 ? 'es' : ''} encontrada{questions.length !== 1 ? 's' : ''})
          </h2>
          <ModelQuestions questions={questions} />
        </div>
      </div>
    </div>
  );
}