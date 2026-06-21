// minhas-listas/criar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { api } from "@/lib/axios";
import { HeadlessMultiSelect } from "@/components/ui/HeadlessMultiSelect";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  PlayCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type FilterOption = {
  id: number | string;
  nome: string;
};

type QuestionStatus = "all" | "solved" | "not-solved";
type CorrectStatus = "all" | "correct" | "incorrect";
type CreationMode = "pessoal" | "simulado";

type CreateListFiltersPayload = {
  frentes: number[];
  assuntos: number[];
  topicos: number[];
  provas: string[];
  anos: number[];
  com_comentarios: boolean;
  status: QuestionStatus;
  acerto: CorrectStatus;
};

type ToastType = "error" | "success";

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function optionIdToString(id: number | string): string {
  return String(id).trim();
}

function normalizeToken(token: unknown): string {
  if (!token) return "";

  return String(token)
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function getClientToken(): string {
  if (typeof window === "undefined") return "";

  const possibleKeys = [
    "laravelToken",
    "laravel_token",
    "token",
    "auth_token",
    "access_token",
    "sanctum_token",
    "bearer_token",
  ];

  for (const key of possibleKeys) {
    const value = window.localStorage.getItem(key);

    if (value) {
      return normalizeToken(value);
    }
  }

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return cookieToken ? normalizeToken(decodeURIComponent(cookieToken)) : "";
}

function authHeaders(token?: string) {
  const cleanToken = normalizeToken(token);

  if (!cleanToken) return {};

  return {
    Authorization: `Bearer ${cleanToken}`,
  };
}

function sameId(a: FilterOption, b: FilterOption): boolean {
  return optionIdToString(a.id) === optionIdToString(b.id);
}

function keepOnlyExistingOptions(
  selected: FilterOption[],
  available: FilterOption[],
): FilterOption[] {
  const safeSelected = safeArray(selected);
  const safeAvailable = safeArray(available);

  if (safeAvailable.length === 0) return safeSelected;

  return safeSelected.filter((item) =>
    safeAvailable.some((option) => sameId(option, item)),
  );
}

function toNumericIds(options: FilterOption[]): number[] {
  return safeArray(options)
    .map((option) => Number(option.id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function toStringIds(options: FilterOption[]): string[] {
  return safeArray(options)
    .map((option) => optionIdToString(option.id))
    .filter(Boolean);
}

function getCreatedListId(payload: any): number | null {
  const id =
    payload?.lista_id ??
    payload?.id ??
    payload?.data?.id ??
    payload?.data?.lista_id ??
    payload?.lista?.id ??
    payload?.data?.lista?.id;

  const numericId = Number(id);

  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
}

function getCreatedListTime(payload: any): number | null {
  const time =
    payload?.time ??
    payload?.lista?.time ??
    payload?.data?.time ??
    payload?.data?.lista?.time;

  const numericTime = Number(time);

  return Number.isFinite(numericTime) && numericTime > 0 ? numericTime : null;
}

function getButtonClass(active: boolean, variant: "blue" | "green" | "red") {
  const base =
    "rounded-md border px-3 py-3 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-45";

  if (!active) {
    return `${base} border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-gray-700 dark:bg-[#2A303C] dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-white`;
  }

  if (variant === "green") {
    return `${base} border-green-500 bg-green-600 text-white shadow-[0_0_18px_rgba(22,163,74,0.28)]`;
  }

  if (variant === "red") {
    return `${base} border-red-500 bg-red-600 text-white shadow-[0_0_18px_rgba(220,38,38,0.28)]`;
  }

  return `${base} border-[#0E00D0] bg-[#0E00D0] text-white shadow-[0_0_20px_rgba(14,0,208,0.32)]`;
}

export default function CriarMinhaListaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const token = useMemo(() => {
    return normalizeToken(
      (session as any)?.laravelToken ||
        (session as any)?.accessToken ||
        (session as any)?.user?.laravelToken ||
        getClientToken(),
    );
  }, [session]);

  const [listName, setListName] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  const [selectedFronts, setSelectedFronts] = useState<FilterOption[]>([]);
  const [selectedExams, setSelectedExams] = useState<FilterOption[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<FilterOption[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<FilterOption[]>([]);
  const [selectedYears, setSelectedYears] = useState<FilterOption[]>([]);

  const [wantsComments, setWantsComments] = useState(false);
  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>("all");
  const [correctStatus, setCorrectStatus] = useState<CorrectStatus>("all");

  const [fronts, setFronts] = useState<FilterOption[]>([]);
  const [subjects, setSubjects] = useState<FilterOption[]>([]);
  const [topics, setTopics] = useState<FilterOption[]>([]);
  const [exams, setExams] = useState<FilterOption[]>([]);
  const [years, setYears] = useState<FilterOption[]>([]);

  const [isFrontLoading, setIsFrontLoading] = useState(false);
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);
  const [isYearsLoading, setIsYearsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [titleTouched, setTitleTouched] = useState(false);
  const [questionCountTouched, setQuestionCountTouched] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("error");
  const [showToast, setShowToast] = useState(false);

  const [creationMode, setCreationMode] = useState<CreationMode>("pessoal");

  const [createdSimuladoId, setCreatedSimuladoId] = useState<number | null>(
    null,
  );
  const [createdSimuladoTime, setCreatedSimuladoTime] = useState<number | null>(
    null,
  );
  const [showSimuladoStartModal, setShowSimuladoStartModal] = useState(false);

  useDocumentTitle("Criar Lista");

  const safeSelectedFronts = safeArray(selectedFronts);
  const safeSelectedSubjects = safeArray(selectedSubjects);
  const safeSelectedExams = safeArray(selectedExams);
  const safeSelectedYears = safeArray(selectedYears);

  const safeSubjects = safeArray(subjects);
  const safeTopics = safeArray(topics);
  const safeYears = safeArray(years);

  const trimmedTitle = listName.trim();
  const hasActiveFilters =
    safeArray(selectedFronts).length > 0 ||
    safeArray(selectedExams).length > 0 ||
    safeArray(selectedSubjects).length > 0 ||
    safeArray(selectedTopics).length > 0 ||
    safeArray(selectedYears).length > 0 ||
    wantsComments ||
    questionStatus !== "all" ||
    correctStatus !== "all";

  const titleError =
    titleTouched && trimmedTitle.length === 0
      ? "Digite um título para a lista."
      : titleTouched && trimmedTitle.length < 3
        ? "O título deve ter ao menos 3 caracteres."
        : titleTouched && trimmedTitle.length > 50
          ? "O título deve ter no máximo 50 caracteres."
          : "";

  const questionCountError =
    questionCountTouched && questionCount < 1
      ? "A lista deve ter ao menos 1 questão."
      : questionCountTouched && questionCount > 100
        ? "O limite máximo é de 100 questões."
        : "";

  const isSubjectDisabled =
    isSubjectsLoading ||
    (safeSelectedFronts.length === 0 && safeSubjects.length === 0);

  const isTopicDisabled =
    isTopicsLoading ||
    (safeSelectedSubjects.length === 0 && safeTopics.length === 0);

  const isYearDisabled = isYearsLoading || safeYears.length === 0;
  const isCorrectDisabled = questionStatus === "not-solved";

  function showToastMessage(
    message: string,
    type: ToastType = "error",
  ) {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    window.setTimeout(() => setShowToast(false), 3200);
  }

  function handleTitleChange(value: string) {
    setTitleTouched(true);

    if (value.length > 50) {
      setListName(value.slice(0, 50));
      showToastMessage("O título da lista pode ter no máximo 50 caracteres.");
      return;
    }

    setListName(value);
  }


  function handleQuestionCountChange(value: string) {
    setQuestionCountTouched(true);

    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isFinite(parsedValue)) {
      setQuestionCount(1);
      return;
    }

    if (parsedValue < 1) {
      setQuestionCount(1);
      showToastMessage("A quantidade mínima é de 1 questão.");
      return;
    }

    if (parsedValue > 100) {
      setQuestionCount(100);
      showToastMessage("O limite máximo é de 100 questões.");
      return;
    }

    if (parsedValue === 100) {
      showToastMessage(
        "Você atingiu o limite máximo de 100 questões.",
        "success",
      );
    }

    setQuestionCount(parsedValue);
  }

  function buildFiltersPayload(): CreateListFiltersPayload {
    const statusValue = questionStatus;
    const acertoValue = statusValue === "not-solved" ? "all" : correctStatus;

    return {
      frentes: toNumericIds(selectedFronts),
      assuntos: toNumericIds(selectedSubjects),
      topicos: toNumericIds(selectedTopics),
      provas: toStringIds(selectedExams),
      anos: toNumericIds(selectedYears),
      com_comentarios: wantsComments,
      status: statusValue,
      acerto: acertoValue,
    };
  }

  useEffect(() => {
    if (status === "loading") return;
    if (!token) return;

    let cancelled = false;

    async function fetchInitialOptions() {
      setIsFrontLoading(true);
      setIsExamLoading(true);

      try {
        const [frontsResponse, examsResponse] = await Promise.all([
          api.get("/filtros/frentes", {
            headers: authHeaders(token),
          }),
          api.get("/filtros/provas-grupos", {
            headers: authHeaders(token),
          }),
        ]);

        if (cancelled) return;

        setFronts(safeArray<FilterOption>(frontsResponse.data));
        setExams(safeArray<FilterOption>(examsResponse.data));
      } catch (error) {
        console.error("Erro ao carregar filtros iniciais:", error);

        if (!cancelled) {
          setFronts([]);
          setExams([]);
          showToastMessage("Não foi possível carregar os filtros.");
        }
      } finally {
        if (!cancelled) {
          setIsFrontLoading(false);
          setIsExamLoading(false);
        }
      }
    }

    fetchInitialOptions();

    return () => {
      cancelled = true;
    };
  }, [token, status]);

  useEffect(() => {
    if (!token) return;

    const safeFronts = safeArray(selectedFronts);

    if (safeFronts.length === 0) {
      setSubjects([]);
      setSelectedSubjects([]);
      setTopics([]);
      setSelectedTopics([]);
      return;
    }

    let cancelled = false;

    async function fetchSubjects() {
      setIsSubjectsLoading(true);

      try {
        const frontIdsString = safeFronts
          .map((front) => optionIdToString(front.id))
          .join(",");

        const response = await api.get("/filtros/assuntos", {
          params: { frentes: frontIdsString },
          headers: authHeaders(token),
        });

        if (cancelled) return;

        const availableSubjects = safeArray<FilterOption>(response.data);

        setSubjects(availableSubjects);
        setSelectedSubjects((current) =>
          keepOnlyExistingOptions(safeArray(current), availableSubjects),
        );
      } catch (error) {
        console.error("Erro ao buscar assuntos:", error);

        if (!cancelled) {
          setSubjects([]);
          setSelectedSubjects([]);
          setTopics([]);
          setSelectedTopics([]);
          showToastMessage("Não foi possível carregar os assuntos.");
        }
      } finally {
        if (!cancelled) {
          setIsSubjectsLoading(false);
        }
      }
    }

    fetchSubjects();

    return () => {
      cancelled = true;
    };
  }, [selectedFronts, token]);

  useEffect(() => {
    if (!token) return;

    const safeSubjectsSelected = safeArray(selectedSubjects);

    if (safeSubjectsSelected.length === 0) {
      setTopics([]);
      setSelectedTopics([]);
      return;
    }

    let cancelled = false;

    async function fetchTopics() {
      setIsTopicsLoading(true);

      try {
        const subjectIdsString = safeSubjectsSelected
          .map((subject) => optionIdToString(subject.id))
          .join(",");

        const response = await api.get("/filtros/topicos", {
          params: { assuntos: subjectIdsString },
          headers: authHeaders(token),
        });

        if (cancelled) return;

        const availableTopics = safeArray<FilterOption>(response.data);

        setTopics(availableTopics);
        setSelectedTopics((current) =>
          keepOnlyExistingOptions(safeArray(current), availableTopics),
        );
      } catch (error) {
        console.error("Erro ao buscar tópicos:", error);

        if (!cancelled) {
          setTopics([]);
          setSelectedTopics([]);
          showToastMessage("Não foi possível carregar os tópicos.");
        }
      } finally {
        if (!cancelled) {
          setIsTopicsLoading(false);
        }
      }
    }

    fetchTopics();

    return () => {
      cancelled = true;
    };
  }, [selectedSubjects, token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function fetchYears() {
      setIsYearsLoading(true);

      try {
        const provaSiglas = safeArray(selectedExams)
          .map((exam) => optionIdToString(exam.id))
          .filter(Boolean)
          .join(",");

        const response = await api.get("/filtros/anos-provas", {
          params: provaSiglas ? { provas: provaSiglas } : {},
          headers: authHeaders(token),
        });

        if (cancelled) return;

        const availableYears = safeArray<FilterOption>(response.data);

        setYears(availableYears);
        setSelectedYears((current) =>
          keepOnlyExistingOptions(safeArray(current), availableYears),
        );
      } catch (error) {
        console.error("Erro ao buscar anos por prova:", error);

        if (!cancelled) {
          setYears([]);
          setSelectedYears([]);
          showToastMessage("Não foi possível carregar os anos.");
        }
      } finally {
        if (!cancelled) {
          setIsYearsLoading(false);
        }
      }
    }

    fetchYears();

    return () => {
      cancelled = true;
    };
  }, [selectedExams, token]);

  function handleQuestionStatusClick(nextStatus: QuestionStatus) {
    setQuestionStatus((current) => {
      const resolvedStatus = current === nextStatus ? "all" : nextStatus;

      if (resolvedStatus === "not-solved" || resolvedStatus === "all") {
        setCorrectStatus("all");
      }

      return resolvedStatus;
    });
  }

  function handleCorrectStatusClick(nextStatus: CorrectStatus) {
    if (questionStatus === "not-solved") return;

    setCorrectStatus((current) => {
      const resolvedStatus = current === nextStatus ? "all" : nextStatus;

      if (resolvedStatus !== "all") {
        setQuestionStatus("solved");
      }

      return resolvedStatus;
    });
  }

  function clearAllFilters() {
    setListName("");
    setQuestionCount(10);
    setTitleTouched(false);
    setQuestionCountTouched(false);

    setSelectedFronts([]);
    setSelectedExams([]);
    setSelectedSubjects([]);
    setSelectedTopics([]);
    setSelectedYears([]);

    setSubjects([]);
    setTopics([]);

    setWantsComments(false);
    setQuestionStatus("all");
    setCorrectStatus("all");
    setCreationMode("pessoal");
  }

  async function handleCreateList() {
    setTitleTouched(true);
    setQuestionCountTouched(true);

    if (!token) {
      showToastMessage("Sessão inválida. Faça login novamente.");
      return;
    }

    if (trimmedTitle.length < 3) {
      showToastMessage("Digite um título com pelo menos 3 caracteres.");
      return;
    }

    if (trimmedTitle.length > 50) {
      showToastMessage("O título deve ter no máximo 50 caracteres.");
      return;
    }

    if (questionCount < 1) {
      showToastMessage("A lista deve ter ao menos 1 questão.");
      return;
    }

    if (questionCount > 100) {
      showToastMessage("O limite máximo é de 100 questões.");
      return;
    }

    setIsCreating(true);

    try {
      const filtersPayload = buildFiltersPayload();

      const payload = {
        name: trimmedTitle,
        descricao: null,
        quantidade: questionCount,
        tipo: creationMode,

        ...filtersPayload,
      };

      const response = await api.post(
        "/listas/pessoais/gerar-por-filtros",
        payload,
        {
          headers: authHeaders(token),
        },
      );

      const createdId = getCreatedListId(response.data);

      if (!createdId) {
        showToastMessage("Lista criada, mas não foi possível abrir a lista.");
        return;
      }

      showToastMessage(
        creationMode === "simulado"
          ? "Simulado criado com sucesso!"
          : "Lista criada com sucesso!",
        "success",
      );

      if (creationMode === "simulado") {
        setCreatedSimuladoId(createdId);
        setCreatedSimuladoTime(getCreatedListTime(response.data));
        setShowSimuladoStartModal(true);
        return;
      }

      router.push(`/exercicios/minhas-listas/${createdId}`);
    } catch (error: any) {
      console.error("Erro ao criar lista:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Não foi possível criar a lista com esses filtros.";

      showToastMessage(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <ExercisesHeader />

      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 transition-colors dark:bg-[#00091A] dark:text-white sm:px-8 md:px-16">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.push("/exercicios/minhas-listas")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para minhas listas
          </button>

          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#263247] dark:bg-[#101827]">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-[#263247] dark:bg-[#08111F]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>


                  <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    Criar lista personalizada
                  </h1>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                    As questões serão filtradas pelos critérios escolhidos e
                    selecionadas conforme a disponibilidade do banco.
                  </p>
                </div>

                
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-[#263247] dark:bg-[#1D232D]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                        Título da lista
                      </label>

                      <span
                        className={`text-xs ${
                          listName.length >= 45
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {listName.length}/50
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Ex.: Revisão de funções"
                      value={listName}
                      minLength={3}
                      maxLength={50}
                      onBlur={() => setTitleTouched(true)}
                      onChange={(event) =>
                        handleTitleChange(event.target.value)
                      }
                      className={`h-12 w-full rounded-md border bg-white px-4 text-base text-slate-950 placeholder:text-slate-400 outline-none transition focus:ring-1 dark:bg-[#202735] dark:text-white dark:placeholder:text-slate-500 ${
                        titleError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-slate-200 focus:border-[#0E00D0] focus:ring-[#0E00D0] dark:border-[#303A4F]"
                      }`}
                    />

                    <div className="mt-2 min-h-[20px] text-xs">
                      {titleError ? (
                        <span className="text-red-500 dark:text-red-400">
                          {titleError}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Use entre 3 e 50 caracteres.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-[#263247] dark:bg-[#1D232D]">
                    <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                      Quantidade de questões
                    </label>

                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={questionCount}
                      onBlur={() => setQuestionCountTouched(true)}
                      onChange={(event) =>
                        handleQuestionCountChange(event.target.value)
                      }
                      className={`h-12 w-full rounded-md border bg-white px-4 text-base text-slate-950 outline-none transition focus:ring-1 dark:bg-[#202735] dark:text-white ${
                        questionCountError
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-slate-200 focus:border-[#0E00D0] focus:ring-[#0E00D0] dark:border-[#303A4F]"
                      }`}
                    />

                    <div className="mt-2 min-h-[20px] text-xs">
                      {questionCountError ? (
                        <span className="text-red-500 dark:text-red-400">
                          {questionCountError}
                        </span>
                      ) : questionCount === 100 ? (
                        <span className="text-amber-500 dark:text-amber-400">
                          Limite máximo atingido: 100 questões.
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Escolha entre 1 e 100 questões.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-[#263247] dark:bg-[#1D232D]">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                      Modo de criação
                    </label>

                    <p className="mt-1 text-xs text-slate-500">
                      Escolha como deseja praticar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setCreationMode("pessoal")}
                      className={`rounded-xl border px-4 py-4 text-left transition ${
                        creationMode === "pessoal"
                          ? "border-[#0E00D0] bg-[#0E00D0]/10 text-slate-950 shadow-lg dark:bg-[#0E00D0]/20 dark:text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#2A303C] dark:text-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em]">
                        <ClipboardList className="h-4 w-4" />
                        Lista de exercícios
                      </div>

                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Mostra correção e gabarito durante a resolução.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreationMode("simulado")}
                      className={`rounded-xl border px-4 py-4 text-left transition ${
                        creationMode === "simulado"
                          ? "border-[#0E00D0] bg-[#0E00D0]/10 text-slate-950 shadow-lg dark:bg-[#0E00D0]/20 dark:text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#2A303C] dark:text-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em]">
                        <FileText className="h-4 w-4" />
                        Simulado
                      </div>

                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Só mostra o resultado depois da finalização ou fim do
                        tempo.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#263247] dark:bg-[#101827]">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Filtros da lista
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Estes filtros serão enviados ao backend para selecionar as
                  questões e equilibrar a dificuldade.
                </p>
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                disabled={isCreating}
                className="inline-flex h-10 min-w-[128px] cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#303A4F] dark:bg-[#202735] dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar tudo
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                    Frente(s)
                  </label>

                  <HeadlessMultiSelect
                    placeholder="Selecione a(s) frente(s)"
                    options={safeArray(fronts)}
                    selectedOptions={safeSelectedFronts}
                    onChange={setSelectedFronts}
                    isLoading={isFrontLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                    Prova(s)
                  </label>

                  <HeadlessMultiSelect
                    placeholder="Ex.: ENEM, UEMG, FUVEST"
                    options={safeArray(exams)}
                    selectedOptions={safeSelectedExams}
                    onChange={setSelectedExams}
                    isLoading={isExamLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                    Assunto(s)
                  </label>

                  <HeadlessMultiSelect
                    placeholder="Selecione o(s) assunto(s)"
                    options={safeSubjects}
                    selectedOptions={safeSelectedSubjects}
                    onChange={setSelectedSubjects}
                    disabled={isSubjectDisabled}
                    isLoading={isSubjectsLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                    Ano(s)
                  </label>

                  <HeadlessMultiSelect
                    placeholder={
                      safeSelectedExams.length > 0
                        ? "Anos disponíveis da(s) prova(s)"
                        : "Selecione o(s) ano(s)"
                    }
                    options={safeYears}
                    selectedOptions={safeSelectedYears}
                    onChange={setSelectedYears}
                    disabled={isYearDisabled}
                    isLoading={isYearsLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                    Tópico(s)
                  </label>

                  <HeadlessMultiSelect
                    placeholder="Selecione o(s) tópico(s)"
                    options={safeTopics}
                    selectedOptions={safeArray(selectedTopics)}
                    onChange={setSelectedTopics}
                    disabled={isTopicDisabled}
                    isLoading={isTopicsLoading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                    Opções
                  </label>

                  <label
                    htmlFor="gabarito-comentado"
                    className={`flex h-12 cursor-pointer items-center rounded-md border p-3 transition ${
                      wantsComments
                        ? "border-[#0E00D0] bg-[#0E00D0]/10"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-gray-700 dark:bg-[#2A303C] dark:hover:border-gray-500"
                    }`}
                  >
                    <input
                      id="gabarito-comentado"
                      type="checkbox"
                      checked={wantsComments}
                      onChange={(event) =>
                        setWantsComments(event.target.checked)
                      }
                      className="h-5 w-5 cursor-pointer rounded border-slate-300 text-[#0E00D0] accent-[#0E00D0] focus:ring-2 focus:ring-[#0E00D0] focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700"
                    />

                    <span
                      className={`ml-3 text-base font-medium ${
                        wantsComments
                          ? "text-slate-950 dark:text-white"
                          : "text-slate-600 dark:text-gray-300"
                      }`}
                    >
                      Gabarito comentado
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex h-full flex-col">
                <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
                  Questões que
                </label>

                <div className="grid h-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={getButtonClass(
                      questionStatus === "not-solved",
                      "blue",
                    )}
                    onClick={() => handleQuestionStatusClick("not-solved")}
                  >
                    Não resolvi
                  </button>

                  <button
                    type="button"
                    className={getButtonClass(
                      questionStatus === "solved",
                      "blue",
                    )}
                    onClick={() => handleQuestionStatusClick("solved")}
                  >
                    Resolvi
                  </button>

                  <button
                    type="button"
                    disabled={isCorrectDisabled}
                    className={getButtonClass(
                      correctStatus === "correct",
                      "green",
                    )}
                    onClick={() => handleCorrectStatusClick("correct")}
                    title={
                      isCorrectDisabled
                        ? "Questões não resolvidas não podem ser filtradas como certas."
                        : undefined
                    }
                  >
                    Acertei
                  </button>

                  <button
                    type="button"
                    disabled={isCorrectDisabled}
                    className={getButtonClass(
                      correctStatus === "incorrect",
                      "red",
                    )}
                    onClick={() => handleCorrectStatusClick("incorrect")}
                    title={
                      isCorrectDisabled
                        ? "Questões não resolvidas não podem ser filtradas como erradas."
                        : undefined
                    }
                  >
                    Errei
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCreateList}
                disabled={
                  isCreating ||
                  !!titleError ||
                  !!questionCountError ||
                  trimmedTitle.length < 3
                }
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#0E00D0] px-6 text-sm font-black text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : creationMode === "simulado" ? (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Criar simulado
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Criar lista
                  </>
                )}
              </button>

              <p className="text-xs leading-5 text-slate-500">
                O backend receberá somente IDs/siglas limpos e fará a seleção
                equilibrada por dificuldade.
              </p>
            </div>
          </section>
        </div>

        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className={`fixed left-1/2 top-8 z-50 -translate-x-1/2 rounded-xl px-6 py-4 text-sm font-semibold text-white shadow-2xl ${
                toastType === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showSimuladoStartModal && createdSimuladoId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#08111F] dark:text-white">
            <div className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
              Simulado criado
            </div>

            <h2 className="mt-4 text-2xl font-black">
              Preparar para iniciar a prova
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Você criou um simulado. Ao iniciar, o cronômetro começará
              imediatamente e as respostas não mostrarão certo ou errado até a
              finalização.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Questões
                </div>
                <div className="mt-1 text-2xl font-black">{questionCount}</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Tempo estimado
                </div>
                <div className="mt-1 text-2xl font-black">
                  {createdSimuladoTime ?? "—"} min
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-yellow-500/30 dark:bg-yellow-950/20 dark:text-yellow-100">
              Antes de começar, confira se está pronto. Depois que iniciar, o
              cronômetro começará a contar.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/listas/${createdSimuladoId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Baixar PDF
              </a>

              <button
                type="button"
                onClick={() => {
                  setShowSimuladoStartModal(false);
                  router.push(`/exercicios/minhas-listas/${createdSimuladoId}`);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Ver sem iniciar
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSimuladoStartModal(false);
                  router.push(
                    `/exercicios/minhas-listas/${createdSimuladoId}?start=1`,
                  );
                }}
                className="rounded-xl bg-[#0E00D0] px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Iniciar simulado
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}