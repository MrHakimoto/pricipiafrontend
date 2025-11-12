"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {LoadingSpinner} from "@/components/ui/spinnerLoading";
import { FilterPanel } from "@/components/Panel/PanelFilter";
import { ModelQuestions } from "@/components/questions/ModelQuestions";
import { getFilterOptionsByIds, getFilteredQuestions, getAssuntosByFrentes, getTopicosByAssuntos } from "@/lib/filtra";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";

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


type FilterOption = { id: number; nome: string; };

export default function SearchResultsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [initialFilters, setInitialFilters] = useState<Partial<FilterPanelProps>>({});
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            if (status === 'authenticated' && session.laravelToken) {
                try {
                    setIsLoading(true);
                    const token = session.laravelToken;

                    // 1. Processa a URL
                    const pathFilters: { [key: string]: string[] } = {};
                    const slug = Array.isArray(params.slug) ? params.slug : [];
                    for (let i = 0; i < slug.length; i += 2) {
                        const key = slug[i];
                        const values = slug[i + 1]?.split(',') || [];
                        pathFilters[key] = values;
                    }
                    const queryFilters: { [key: string]: string } = Object.fromEntries(searchParams.entries());

                    // 2. Busca todos os dados da API em paralelo, EXCETO OS ANOS
                    const [
                        fronts, exams, subjects, topics, fetchedQuestions
                    ] = await Promise.all([
                        getFilterOptionsByIds('frentes', pathFilters.frente, token),
                        getFilterOptionsByIds('provas', pathFilters.prova, token),
                        getFilterOptionsByIds('assuntos', pathFilters.assunto, token),
                        getFilterOptionsByIds('topicos', pathFilters.topico, token),
                        // A CHAMADA PARA 'ANOS' FOI REMOVIDA DAQUI
                        getFilteredQuestions({ ...pathFilters }, queryFilters, token),
                    ]);

                    // 3. "Hidrata" os anos manualmente a partir da URL
                    const yearIds = pathFilters.ano || [];
                    const initialSelectedYears = yearIds.map(id => ({
                        id: Number(id),
                        nome: String(id)
                    }));
                    
                    // 4. Busca as OPÇÕES para os filtros dependentes
                    const [ subjectOptions, topicOptions ] = await Promise.all([
                        getAssuntosByFrentes(pathFilters.frente?.join(','), token),
                        getTopicosByAssuntos(pathFilters.assunto?.join(','), token),
                    ]);

                    // 5. Monta o objeto final de props para o FilterPanel
                    setInitialFilters({
                        initialSelectedFronts: fronts,
                        initialSelectedExams: exams,
                        initialSelectedSubjects: subjects,
                        initialSelectedTopics: topics,
                        initialSelectedYears: initialSelectedYears, // Usa os anos gerados localmente
                        initialWantsComments: queryFilters.com_comentarios === 'true',
                        initialQuestionStatus: queryFilters.status || 'all',
                        initialCorrectStatus: queryFilters.acerto || 'all',
                        subjectOptions,
                        topicOptions,
                    });
                    setQuestions(fetchedQuestions?.data || []);

                } catch (err) {
                    setError("Falha ao carregar os dados da busca.");
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (status !== 'loading' && params) {
            fetchAllData();
        }
    }, [session, status, params, searchParams]);

    if (isLoading || status === 'loading') {
        return <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"> <LoadingSpinner className={'p-2 h-70 w-70'} /> </div>;
    }

    if (error) {
        return <div>Ocorreu um erro: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-[#00091A]">
            <ExercisesHeader />
            <div className="max-w-6xl mx-auto mt-5 px-4">
                <FilterPanel {...initialFilters} />
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Resultados da Busca ({questions.length} questões encontradas)
                    </h2>
                    <ModelQuestions questions={questions} />
                </div>
            </div>
        </div>
    );
}