"use client";

import { useEffect, useState } from "react";
import { api } from '@/lib/axios';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeadlessMultiSelect } from '@/components/ui/HeadlessMultiSelect';

// Padrão: Definindo um tipo para as opções, para garantir consistência.
type FilterOption = {
    id: number;
    nome: string;
};

type FilterPanelProps = {
    initialSelectedFronts?: FilterOption[];
    initialSelectedExams?: FilterOption[];
    initialSelectedSubjects?: FilterOption[];
    initialSelectedTopics?: FilterOption[];
    initialSelectedYears?: FilterOption[];
    initialWantsComments?: boolean;
    initialQuestionStatus?: string;
    initialCorrectStatus?: string;
    // Props para as OPÇÕES pré-carregadas na página de resultados
    subjectOptions?: FilterOption[];
    topicOptions?: FilterOption[];
};

export const FilterPanel = ({
    initialSelectedFronts,
    initialSelectedExams,
    initialSelectedSubjects,
    initialSelectedTopics,
    initialSelectedYears,
    initialWantsComments,
    initialQuestionStatus,
    initialCorrectStatus,
    subjectOptions,
    topicOptions
}: FilterPanelProps) => {
    const router = useRouter();
    const { data: session } = useSession();

    // --- Estados para VALORES SELECIONADOS ---
    const [selectedFronts, setSelectedFronts] = useState<FilterOption[]>(initialSelectedFronts || []);
    const [selectedExams, setSelectedExams] = useState<FilterOption[]>(initialSelectedExams || []);
    const [selectedSubjects, setSelectedSubjects] = useState<FilterOption[]>(initialSelectedSubjects || []);
    const [selectedTopics, setSelectedTopics] = useState<FilterOption[]>(initialSelectedTopics || []);
    const [selectedYears, setSelectedYears] = useState<FilterOption[]>(initialSelectedYears || []);
    const [wantsComments, setWantsComments] = useState(initialWantsComments || false);
    const [questionStatus, setQuestionStatus] = useState(initialQuestionStatus || "all");
    const [correctStatus, setCorrectStatus] = useState(initialCorrectStatus || "all");

    // --- Estados para as OPÇÕES disponíveis ---
    const [fronts, setFronts] = useState<FilterOption[]>([]);
    const [subjects, setSubjects] = useState<FilterOption[]>(subjectOptions || []);
    const [topics, setTopics] = useState<FilterOption[]>(topicOptions || []);
    const [exams, setExams] = useState<FilterOption[]>([]);
    const [years, setYears] = useState<FilterOption[]>([]);

    // --- Estados de Carregamento (Loading) ---
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
    const [isTopicsLoading, setIsTopicsLoading] = useState(false);
    const [isFrenteLoading, setIsFremteLoading] = useState(false);
    const [isProvaLoading, setIsProvaLoading] = useState(false);


    // Efeito para buscar dados iniciais (NÃO dependentes)
    useEffect(() => {
        if (session && session.laravelToken) {
            const fetchInitialOptions = async () => {
                setIsFremteLoading(true);
                setIsProvaLoading(true);
                try {
                    const [frontsResponse, examsResponse] = await Promise.all([
                        api.get('/filtros/frentes', { headers: { Authorization: `Bearer ${session.laravelToken}` } }),
                        api.get('/filtros/provas', { headers: { Authorization: `Bearer ${session.laravelToken}` } })
                    ]);
                    setFronts(frontsResponse.data);
                    setExams(examsResponse.data);
                    setIsFremteLoading(false)
                    setIsProvaLoading(false);
                } catch (error) {
                    console.error("Erro ao buscar filtros iniciais:", error);
                }
            };

            const generateYears = () => {
                const currentYear = new Date().getFullYear();
                const startYear = 2010;
                const yearsArray = Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
                    const year = currentYear - i;
                    return { id: year, nome: String(year) };
                });
                setYears(yearsArray);
            };

            fetchInitialOptions();
            generateYears();
        }
    }, [session]);

    // Efeito de CASCATA para INTERAÇÃO DO USUÁRIO com Frentes
    useEffect(() => {
        // Se `subjectOptions` existe, a carga é controlada pela página pai. Este efeito não deve rodar.
        if (subjectOptions) return;

        setSubjects([]);
        setSelectedSubjects([]);
        if (selectedFronts.length > 0 && session) {
            const frontIdsString = selectedFronts.map(front => front.id).join(',');
            const fetchSubjects = async () => {
                setIsSubjectsLoading(true);
                try {
                    const response = await api.get(`/filtros/assuntos?frentes=${frontIdsString}`, {
                        headers: { Authorization: `Bearer ${session.laravelToken}` },
                    });
                    setSubjects(response.data);
                } catch (error) {
                    console.error("Erro ao buscar assuntos:", error);
                } finally {
                    setIsSubjectsLoading(false);
                }
            };
            fetchSubjects();
        }
    }, [selectedFronts, session, subjectOptions]);

    // Efeito de CASCATA para INTERAÇÃO DO USUÁRIO com Assuntos
    useEffect(() => {
        // Se `topicOptions` existe, a carga é controlada pela página pai.
        if (topicOptions) return;

        setTopics([]);
        setSelectedTopics([]);
        if (selectedSubjects.length > 0 && session) {
            const subjectIdsString = selectedSubjects.map(subject => subject.id).join(',');
            const fetchTopics = async () => {
                setIsTopicsLoading(true);
                try {
                    const response = await api.get(`/filtros/topicos?assuntos=${subjectIdsString}`, {
                        headers: { Authorization: `Bearer ${session.laravelToken}` },
                    });
                    setTopics(response.data);
                } catch (error) {
                    console.error("Erro ao buscar tópicos:", error);
                } finally {
                    setIsTopicsLoading(false);
                }
            };
            fetchTopics();
        }
    }, [selectedSubjects, session, topicOptions]);

    const handleSearch = () => {
        const pathSegments: string[] = [];

        const addMultiSelectToPath = (key: string, items: FilterOption[]) => {
            if (items.length > 0) {
                pathSegments.push(key);
                pathSegments.push(items.map(item => item.id).join(','));
            }
        };

        addMultiSelectToPath('frente', selectedFronts);
        addMultiSelectToPath('prova', selectedExams);
        addMultiSelectToPath('assunto', selectedSubjects);
        addMultiSelectToPath('topico', selectedTopics);
        addMultiSelectToPath('ano', selectedYears);

        const queryParams = new URLSearchParams();

        if (wantsComments) queryParams.append('com_comentarios', 'true');
        if (questionStatus !== 'all') queryParams.append('status', questionStatus);
        if (correctStatus !== 'all') queryParams.append('acerto', correctStatus);

        const finalPath = pathSegments.join('/');
        const searchUrl = finalPath ? `/exercicios/s/${finalPath}` : '/exercicios/s';
        const queryString = queryParams.toString();
        const finalUrl = `${searchUrl}${queryString ? `?${queryString}` : ''}`;

        router.push(finalUrl);
    };

    return (
        <div className="bg-[#1D232D] rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

                {/* Coluna 1: Frente + Prova */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-base font-medium text-white mb-2">Frente(s)</label>
                        <HeadlessMultiSelect
                            placeholder="Selecione a(s) frente(s)"
                            options={fronts}
                            selectedOptions={selectedFronts}
                            onChange={setSelectedFronts}
                            isLoading={isFrenteLoading}

                        />
                    </div>
                    <div>
                        <label className="block text-base font-medium text-white mb-2">Prova(s)</label>
                        <HeadlessMultiSelect
                            placeholder="Selecione a(s) prova(s)"
                            options={exams}
                            selectedOptions={selectedExams}
                            onChange={setSelectedExams}
                            isLoading={isProvaLoading}
                        />
                    </div>
                </div>

                {/* Coluna 2: Assunto + Ano */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-base font-medium text-white mb-2">Assunto(s)</label>
                        <HeadlessMultiSelect
                            placeholder="Selecione o(s) assunto(s)"
                            options={subjects}
                            selectedOptions={selectedSubjects}
                            onChange={setSelectedSubjects}
                            disabled={selectedFronts.length === 0 || isSubjectsLoading}

                        />
                    </div>
                    <div>
                        <label className="block text-base font-medium text-white mb-2">Ano(s)</label>
                        <HeadlessMultiSelect
                            placeholder="Selecione o(s) ano(s)"
                            options={years}
                            selectedOptions={selectedYears}
                            onChange={setSelectedYears}
                        />
                    </div>
                </div>

                {/* Coluna 3: Tópico + Opções */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-base font-medium text-white mb-2">Tópico(s)</label>
                        <HeadlessMultiSelect
                            placeholder="Selecione o(s) tópico(s)"
                            options={topics}
                            selectedOptions={selectedTopics}
                            onChange={setSelectedTopics}
                            disabled={selectedSubjects.length === 0 || isTopicsLoading}
                            isLoading={isTopicsLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-base font-medium text-white mb-2">Opções</label>
                        <div className="flex items-center bg-[#2A303C] border border-gray-700 rounded-md p-3 h-full">
                            <input
                                id="gabarito-comentado"
                                type="checkbox"
                                checked={wantsComments}
                                onChange={(e) => setWantsComments(e.target.checked)}
                                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"
                            />
                            <label htmlFor="gabarito-comentado" className="cursor-pointer ml-3 text-base font-medium text-gray-300">
                                Gabarito comentado
                            </label>
                        </div>
                    </div>
                </div>

                {/* Coluna 4: Questões que (botões) */}
                <div className="flex flex-col h-full">
                    <label className="block text-base font-medium text-white mb-2">Questões que</label>
                    <div className="grid grid-cols-2 gap-2 h-full">
                        <button
                            className={`p-3 rounded-md text-base ${questionStatus === "not-solved" ? "bg-[#0E00D0] text-white" : "bg-[#2A303C] text-gray-400 border border-gray-700"}`}
                            onClick={() => setQuestionStatus("not-solved")}
                        >
                            Não resolvi
                        </button>
                        <button
                            className={`p-3 rounded-md text-base ${questionStatus === "solved" ? "bg-[#0E00D0] text-white" : "bg-[#2A303C] text-gray-400 border border-gray-700"}`}
                            onClick={() => setQuestionStatus("solved")}
                        >
                            Resolvi
                        </button>
                        <button
                            className={`p-3 rounded-md text-base ${correctStatus === "correct" ? "bg-green-600 text-white" : "bg-[#2A303C] text-gray-400 border border-gray-700"}`}
                            onClick={() => setCorrectStatus("correct")}
                        >
                            Acertei
                        </button>
                        <button
                            className={`p-3 rounded-md text-base ${correctStatus === "incorrect" ? "bg-red-600 text-white" : "bg-[#2A303C] text-gray-400 border border-gray-700"}`}
                            onClick={() => setCorrectStatus("incorrect")}
                        >
                            Errei
                        </button>
                    </div>
                </div>
                <button onClick={handleSearch} className="w-full cursor-pointer py-1 bg-[#0E00D0] hover:bg-[#1a00ff] text-white font-medium rounded-md">
                    Buscar
                </button>
            </div>


        </div>
    );
};