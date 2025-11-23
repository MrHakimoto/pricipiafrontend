"use client";

import { useState, useEffect } from "react";
import { ModelQuestions } from "@/components/questions/ModelQuestions";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";

import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeadlessMultiSelect } from "@/components/ui/HeadlessMultiSelect";
import { motion, AnimatePresence } from "framer-motion";

type FilterOption = {
    id: number;
    nome: string;
};

type Exam = {
    id: number;
    sigla: string;
    ano: number;
};

export default function ExercisesPanel() {
    const router = useRouter();
    const { data: session } = useSession();

    // --- Estados do filtro ---
    const [listName, setListName] = useState("");
    const [selectedFronts, setSelectedFronts] = useState<FilterOption[]>([]);
    const [selectedExams, setSelectedExams] = useState<FilterOption[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<FilterOption[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<FilterOption[]>([]);
    const [selectedYears, setSelectedYears] = useState<FilterOption[]>([]);
    const [wantsComments, setWantsComments] = useState(false);
    const [questionStatus, setQuestionStatus] = useState("all");
    const [correctStatus, setCorrectStatus] = useState("all");
    const [questionCount, setQuestionCount] = useState(1);

    // --- Estados de opções ---
    const [fronts, setFronts] = useState<FilterOption[]>([]);
    const [subjects, setSubjects] = useState<FilterOption[]>([]);
    const [topics, setTopics] = useState<FilterOption[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [years, setYears] = useState<FilterOption[]>([]);
    const [availableYears, setAvailableYears] = useState<FilterOption[]>([]);

    // --- Loading ---
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
    const [isTopicsLoading, setIsTopicsLoading] = useState(false);
    const [isFrenteLoading, setIsFrenteLoading] = useState(false);
    const [isProvaLoading, setIsProvaLoading] = useState(false);

    // --- Estado do toast ---
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    const showErrorToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);

        // Desaparece automaticamente após 3 segundos
        setTimeout(() => setShowToast(false), 3000);
    };

    // ------------------------------------------
    // BUSCAR FRENTES E PROVAS AO INICIAR
    // ------------------------------------------
    useEffect(() => {
        if (!session?.laravelToken) return;

        const fetchInitialOptions = async () => {
            setIsFrenteLoading(true);
            setIsProvaLoading(true);

            try {
                const [frontsResponse, examsResponse] = await Promise.all([
                    api.get("/filtros/frentes", {
                        headers: { Authorization: `Bearer ${session.laravelToken}` },
                    }),
                    api.get("/filtros/provas", {
                        headers: { Authorization: `Bearer ${session.laravelToken}` },
                    }),
                ]);

                setFronts(frontsResponse.data);
                setExams(examsResponse.data);
            } catch (error) {
                console.error("Erro ao carregar frentes e provas:", error);
            } finally {
                setIsFrenteLoading(false);
                setIsProvaLoading(false);
            }
        };

        const generateYears = () => {
            const currentYear = new Date().getFullYear();
            const startYear = 2010;

            const yearsArray = Array.from(
                { length: currentYear - startYear + 1 },
                (_, i) => {
                    const year = currentYear - i;
                    return { id: year, nome: String(year) };
                }
            );

            setYears(yearsArray);
            setAvailableYears(yearsArray);
        };

        fetchInitialOptions();
        generateYears();
    }, [session]);

    // ------------------------------------------
    // BUSCAR ASSUNTOS AO SELECIONAR FRENTES
    // ------------------------------------------
    useEffect(() => {
        setSubjects([]);
        setSelectedSubjects([]);

        if (selectedFronts.length === 0 || !session) return;

        const fetchSubjects = async () => {
            setIsSubjectsLoading(true);

            try {
                const ids = selectedFronts.map((f) => f.id).join(",");
                const resp = await api.get(`/filtros/assuntos?frentes=${ids}`, {
                    headers: { Authorization: `Bearer ${session.laravelToken}` },
                });
                setSubjects(resp.data);
            } catch (error) {
                console.error("Erro ao buscar assuntos:", error);
            } finally {
                setIsSubjectsLoading(false);
            }
        };

        fetchSubjects();
    }, [selectedFronts, session]);

    // ------------------------------------------
    // BUSCAR TÓPICOS AO SELECIONAR ASSUNTOS
    // ------------------------------------------
    useEffect(() => {
        setTopics([]);
        setSelectedTopics([]);

        if (selectedSubjects.length === 0 || !session) return;

        const fetchTopics = async () => {
            setIsTopicsLoading(true);

            try {
                const ids = selectedSubjects.map((s) => s.id).join(",");
                const resp = await api.get(`/filtros/topicos?assuntos=${ids}`, {
                    headers: { Authorization: `Bearer ${session.laravelToken}` },
                });
                setTopics(resp.data);
            } catch (error) {
                console.error("Erro ao buscar tópicos:", error);
            } finally {
                setIsTopicsLoading(false);
            }
        };

        fetchTopics();
    }, [selectedSubjects, session]);

    // ------------------------------------------
    // FILTRAR ANOS AO MUDAR PROVAS
    // ------------------------------------------
    useEffect(() => {
        if (selectedExams.length === 0) {
            setAvailableYears(years);
        } else {
            const selectedExamSiglas = selectedExams.map((exam) => exam.nome);

            const yearsFromSelectedExams = exams
                .filter((exam) => selectedExamSiglas.includes(exam.sigla))
                .map((exam) => exam.ano);

            const uniqueYears = [...new Set(yearsFromSelectedExams)]
                .sort((a, b) => b - a)
                .map((year) => ({ id: year, nome: String(year) }));

            setAvailableYears(uniqueYears);

            const currentSelectedYears = selectedYears.filter((year) =>
                uniqueYears.some((availableYear) => availableYear.id === year.id)
            );

            setSelectedYears(currentSelectedYears);
        }
    }, [selectedExams, exams, years]);

    // ------------------------------------------
    // HANDLE SEARCH COM VALIDAÇÃO + TOAST
    // ------------------------------------------
    const handleSearch = async () => {
        if (!listName.trim()) {
            showErrorToast("Digite um nome para a lista antes de continuar.");
            return;
        }

        if (selectedFronts.length === 0 && selectedExams.length === 0) {
            showErrorToast("Selecione ao menos uma frente ou uma prova.");
            return;
        }

        if (questionCount < 3) {
            showErrorToast("A quantidade mínima de questões é 3.");
            return;
        }

        const selectedData = {
            nomeDaLista: listName,
            frentes: selectedFronts,
            provas: selectedExams,
            assuntos: selectedSubjects,
            topicos: selectedTopics,
            anos: selectedYears,
            gabaritoComentado: wantsComments,
            statusResolucao: questionStatus,
            statusAcerto: correctStatus,
            quantidade: questionCount,
        };

        console.log("SELECIONADO:", selectedData);

        if (!session?.laravelToken) return;

        try {
            
            const resp = await api.post(`/listas/gerar-personalizada`, selectedData, {
    headers: { Authorization: `Bearer ${session.laravelToken}` },
});
            console.log(resp);
        } catch (error) {
            console.error("Erro ao buscar assuntos:", error);
        } finally {

        }
    



    const pathSegments: string[] = [];

    const add = (key: string, items: FilterOption[]) => {
        if (items.length > 0) {
            pathSegments.push(key);
            pathSegments.push(items.map((i) => i.id).join(","));
        }
    };

    add("frente", selectedFronts);
    add("prova", selectedExams);
    add("assunto", selectedSubjects);
    add("topico", selectedTopics);
    add("ano", selectedYears);

    const queryParams = new URLSearchParams();
    if (wantsComments) queryParams.append("com_comentarios", "true");
    if (questionStatus !== "all") queryParams.append("status", questionStatus);
    if (correctStatus !== "all") queryParams.append("acerto", correctStatus);
    if (questionCount > 1) queryParams.append("quantidade", questionCount.toString());

    // const path = pathSegments.join("/");
    // const url = path ? `/exercicios/s/${path}` : "/exercicios/s";
    // const finalUrl = queryParams.toString() === "" ? url : `${url}?${queryParams.toString()}`;

    // router.push(finalUrl);
};

// ------------------------------------------
// LISTA ÚNICA DE PROVAS (SIGLAS)
// ------------------------------------------
const uniqueExamOptions = Array.from(
    new Map(exams.map((exam) => [exam.sigla, { id: exam.id, nome: exam.sigla }])).values()
).sort((a, b) => a.nome.localeCompare(b.nome));

// ------------------------------------------
// RENDER
// ------------------------------------------
return (
    <div className="min-h-screen bg-white dark:bg-[#00091A]">
        <ExercisesHeader />

        <div className="max-w-6xl mx-auto mt-5 px-4">
            {/* Nome da lista */}
            <div className="relative mb-10">
                <input
                    type="text"
                    placeholder="Nome da lista"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="block w-full pl-4 pr-4 py-5 text-2xl border border-gray-300 rounded-xl leading-5
              bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500
              dark:bg-[#1D232D] dark:border-gray-700 dark:text-white"
                />
            </div>

            {/* Painel de filtros */}
            <div className="bg-[#1D232D] rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    {/* Frente + Prova */}
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
                                options={uniqueExamOptions}
                                selectedOptions={selectedExams}
                                onChange={setSelectedExams}
                                isLoading={isProvaLoading}
                            />
                        </div>
                    </div>

                    {/* Assunto + Ano */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-base font-medium text-white mb-2">Assunto(s)</label>
                            <HeadlessMultiSelect
                                placeholder="Selecione o(s) assunto(s)"
                                options={subjects}
                                selectedOptions={selectedSubjects}
                                onChange={setSelectedSubjects}
                                disabled={selectedFronts.length === 0 || isSubjectsLoading}
                                isLoading={isSubjectsLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-white mb-2">Ano(s)</label>
                            <HeadlessMultiSelect
                                placeholder="Selecione o(s) ano(s)"
                                options={availableYears}
                                selectedOptions={selectedYears}
                                onChange={setSelectedYears}
                            />
                        </div>
                    </div>

                    {/* Tópico + Comentado */}
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
                                    type="checkbox"
                                    checked={wantsComments}
                                    onChange={(e) => setWantsComments(e.target.checked)}
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-600"
                                />
                                <label className="ml-3 text-base font-medium text-gray-300">
                                    Gabarito comentado
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Questões que */}
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

                    {/* Quantidade */}
                    <div className="flex flex-col gap-2">
                        <label className="block text-base font-medium text-white mb-1">Quantidade de questões</label>
                        <input
                            type="number"
                            min="1"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-[#2A303C] border border-gray-700 rounded-md p-3 text-base text-white"
                            placeholder="Quantidade de questões"
                        />
                    </div>
                </div>
            </div>

            {/* Botão Buscar */}
            <button
                onClick={handleSearch}
                className="py-2 px-4 bg-[#0E00D0] hover:bg-[#1a00ff] text-white font-medium rounded-md text-2xl"
            >
                Buscar
            </button>
        </div>

        {/* TOAST ANIMADO */}
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg z-50"
                >
                    {toastMessage}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);
}
