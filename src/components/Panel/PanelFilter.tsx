// components/Panel/PanelFilter.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { HeadlessMultiSelect } from "@/components/ui/HeadlessMultiSelect";

type FilterOption = {
  id: number | string;
  nome: string;
};

type QuestionStatus = "all" | "solved" | "not-solved";
type CorrectStatus = "all" | "correct" | "incorrect";

type FilterPanelProps = {
  initialSelectedFronts?: FilterOption[];
  initialSelectedExams?: FilterOption[];
  initialSelectedSubjects?: FilterOption[];
  initialSelectedTopics?: FilterOption[];
  initialSelectedYears?: FilterOption[];

  initialWantsComments?: boolean;
  initialQuestionStatus?: QuestionStatus | string;
  initialCorrectStatus?: CorrectStatus | string;

  subjectOptions?: FilterOption[];
  topicOptions?: FilterOption[];
  yearOptions?: FilterOption[];

  submitLabel?: string;
  onSubmitFilters?: (payload: FilterPanelPayload) => void;
};

export type FilterPanelPayload = {
  frentes: string[];
  provas: string[];
  assuntos: string[];
  topicos: string[];
  anos: string[];
  com_comentarios: boolean;
  status: QuestionStatus;
  acerto: CorrectStatus;
};

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeFilterOptions(value: unknown): FilterOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const option = item as Partial<FilterOption>;

      const id = option.id;
      const nome = option.nome;

      if (
        (typeof id !== "number" && typeof id !== "string") ||
        typeof nome !== "string"
      ) {
        return null;
      }

      return {
        id,
        nome,
      };
    })
    .filter((item): item is FilterOption => Boolean(item));
}

function normalizeQuestionStatus(value?: string): QuestionStatus {
  if (value === "solved" || value === "not-solved") return value;
  return "all";
}

function normalizeCorrectStatus(
  value?: string,
  questionStatus?: QuestionStatus,
): CorrectStatus {
  if (questionStatus === "not-solved") return "all";
  if (value === "correct" || value === "incorrect") return value;
  return "all";
}

function optionIdToString(id: number | string): string {
  return String(id).trim();
}

function optionIdsKey(options: FilterOption[] | undefined | null): string {
  return safeArray(options)
    .map((option) => optionIdToString(option.id))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
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

function getButtonClass(active: boolean, variant: "blue" | "green" | "red") {
  const base =
    "rounded-md border px-3 py-3 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-45";

  if (!active) {
    return `${base} border-gray-700 bg-[#2A303C] text-gray-400 hover:border-gray-500 hover:text-white`;
  }

  if (variant === "green") {
    return `${base} border-green-500 bg-green-600 text-white`;
  }

  if (variant === "red") {
    return `${base} border-red-500 bg-red-600 text-white`;
  }

  return `${base} border-[#0E00D0] bg-[#0E00D0] text-white`;
}

function authHeaders(token?: string) {
  if (!token) return {};

  return {
    Authorization: `Bearer ${String(token)
      .replace(/^Bearer\s+/i, "")
      .trim()}`,
  };
}

export const FilterPanel = ({
  initialSelectedFronts,
  initialSelectedExams,
  initialSelectedSubjects,
  initialSelectedTopics,
  initialSelectedYears,
  initialWantsComments = false,
  initialQuestionStatus = "all",
  initialCorrectStatus = "all",
  subjectOptions,
  topicOptions,
  yearOptions,
  submitLabel = "Buscar",
  onSubmitFilters,
}: FilterPanelProps) => {
  const router = useRouter();
  const { data: session } = useSession();

  const laravelToken = useMemo(() => {
    return (session as any)?.laravelToken as string | undefined;
  }, [session]);

  const initialFrontsKey = optionIdsKey(initialSelectedFronts);
  const initialExamsKey = optionIdsKey(initialSelectedExams);
  const initialSubjectsKey = optionIdsKey(initialSelectedSubjects);
  const initialTopicsKey = optionIdsKey(initialSelectedTopics);
  const initialYearsKey = optionIdsKey(initialSelectedYears);

  const subjectOptionsKey = optionIdsKey(subjectOptions);
  const topicOptionsKey = optionIdsKey(topicOptions);
  const yearOptionsKey = optionIdsKey(yearOptions);

  const [selectedFronts, setSelectedFrontsState] = useState<FilterOption[]>(
    () => safeArray(initialSelectedFronts),
  );

  const [selectedExams, setSelectedExamsState] = useState<FilterOption[]>(() =>
    safeArray(initialSelectedExams),
  );

  const [selectedSubjects, setSelectedSubjectsState] = useState<FilterOption[]>(
    () => safeArray(initialSelectedSubjects),
  );

  const [selectedTopics, setSelectedTopicsState] = useState<FilterOption[]>(
    () => safeArray(initialSelectedTopics),
  );

  const [selectedYears, setSelectedYearsState] = useState<FilterOption[]>(() =>
    safeArray(initialSelectedYears),
  );

  const normalizedInitialQuestionStatus = normalizeQuestionStatus(
    initialQuestionStatus,
  );

  const normalizedInitialCorrectStatus = normalizeCorrectStatus(
    initialCorrectStatus,
    normalizedInitialQuestionStatus,
  );

  const [wantsComments, setWantsComments] = useState<boolean>(
    Boolean(initialWantsComments),
  );

  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>(
    normalizedInitialQuestionStatus,
  );

  const [correctStatus, setCorrectStatus] = useState<CorrectStatus>(
    normalizedInitialCorrectStatus,
  );

  const [fronts, setFronts] = useState<FilterOption[]>([]);
  const [subjects, setSubjects] = useState<FilterOption[]>(() =>
    safeArray(subjectOptions),
  );
  const [topics, setTopics] = useState<FilterOption[]>(() =>
    safeArray(topicOptions),
  );
  const [exams, setExams] = useState<FilterOption[]>([]);
  const [years, setYears] = useState<FilterOption[]>(() =>
    safeArray(yearOptions),
  );

  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);
  const [isFrontLoading, setIsFrontLoading] = useState(false);
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [isYearsLoading, setIsYearsLoading] = useState(false);

  function setSelectedFronts(value: FilterOption[] | undefined | null) {
    setSelectedFrontsState(safeArray(value));
  }

  function setSelectedExams(value: FilterOption[] | undefined | null) {
    setSelectedExamsState(safeArray(value));
  }

  function setSelectedSubjects(value: FilterOption[] | undefined | null) {
    setSelectedSubjectsState(safeArray(value));
  }

  function setSelectedTopics(value: FilterOption[] | undefined | null) {
    setSelectedTopicsState(safeArray(value));
  }

  function setSelectedYears(value: FilterOption[] | undefined | null) {
    setSelectedYearsState(safeArray(value));
  }

  useEffect(() => {
    setSelectedFrontsState(safeArray(initialSelectedFronts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFrontsKey]);

  useEffect(() => {
    setSelectedExamsState(safeArray(initialSelectedExams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExamsKey]);

  useEffect(() => {
    setSelectedSubjectsState(safeArray(initialSelectedSubjects));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubjectsKey]);

  useEffect(() => {
    setSelectedTopicsState(safeArray(initialSelectedTopics));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopicsKey]);

  useEffect(() => {
    setSelectedYearsState(safeArray(initialSelectedYears));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialYearsKey]);

  useEffect(() => {
    setWantsComments(Boolean(initialWantsComments));
  }, [initialWantsComments]);

  useEffect(() => {
    const nextQuestionStatus = normalizeQuestionStatus(initialQuestionStatus);
    const nextCorrectStatus = normalizeCorrectStatus(
      initialCorrectStatus,
      nextQuestionStatus,
    );

    setQuestionStatus(nextQuestionStatus);
    setCorrectStatus(nextCorrectStatus);
  }, [initialQuestionStatus, initialCorrectStatus]);

  useEffect(() => {
    setSubjects(safeArray(subjectOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectOptionsKey]);

  useEffect(() => {
    setTopics(safeArray(topicOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicOptionsKey]);

  useEffect(() => {
    setYears(safeArray(yearOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearOptionsKey]);

  /**
   * Busca frentes e GRUPOS de provas.
   *
   * Antes:
   * /filtros/provas
   *
   * Agora:
   * /filtros/provas-grupos
   */
  useEffect(() => {
    if (!laravelToken) return;

    let cancelled = false;

    async function fetchInitialOptions() {
      setIsFrontLoading(true);
      setIsExamLoading(true);

      try {
        const [frontsResponse, examsResponse] = await Promise.all([
          api.get("/filtros/frentes", {
            headers: authHeaders(laravelToken),
          }),
          api.get("/filtros/provas-grupos", {
            headers: authHeaders(laravelToken),
          }),
        ]);

        if (cancelled) return;

        setFronts(safeArray(frontsResponse.data));
        setExams(safeArray(examsResponse.data));
      } catch (error) {
        console.error("Erro ao buscar filtros iniciais:", error);

        if (!cancelled) {
          setFronts([]);
          setExams([]);
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
  }, [laravelToken]);

  /**
   * Cascata: frente -> assunto.
   */
  useEffect(() => {
    if (!laravelToken) return;

    const safeSelectedFronts = safeArray(selectedFronts);

    if (safeSelectedFronts.length === 0) {
      const initialSubjects = safeArray(subjectOptions);
      const initialTopics = safeArray(topicOptions);

      setSubjects(initialSubjects);

      if (initialSubjects.length === 0) {
        setSelectedSubjectsState([]);
        setTopics(initialTopics);

        if (initialTopics.length === 0) {
          setSelectedTopicsState([]);
        }
      }

      return;
    }

    let cancelled = false;

    const frontIdsString = safeSelectedFronts
      .map((front) => optionIdToString(front.id))
      .join(",");

    async function fetchSubjects() {
      setIsSubjectsLoading(true);

      try {
        const response = await api.get("/filtros/assuntos", {
          params: { frentes: frontIdsString },
          headers: authHeaders(laravelToken),
        });

        if (cancelled) return;

        const availableSubjects = normalizeFilterOptions(response.data);

        setSubjects(availableSubjects);
        setSelectedSubjectsState((current) =>
          keepOnlyExistingOptions(safeArray(current), availableSubjects),
        );
      } catch (error) {
        console.error("Erro ao buscar assuntos:", error);

        if (!cancelled) {
          setSubjects([]);
          setSelectedSubjectsState([]);
          setTopics([]);
          setSelectedTopicsState([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    optionIdsKey(selectedFronts),
    laravelToken,
    subjectOptionsKey,
    topicOptionsKey,
  ]);

  /**
   * Cascata: assunto -> tópico.
   */
  useEffect(() => {
    if (!laravelToken) return;

    const safeSelectedSubjects = safeArray(selectedSubjects);

    if (safeSelectedSubjects.length === 0) {
      const initialTopics = safeArray(topicOptions);

      setTopics(initialTopics);

      if (initialTopics.length === 0) {
        setSelectedTopicsState([]);
      }

      return;
    }

    let cancelled = false;

    const subjectIdsString = safeSelectedSubjects
      .map((subject) => optionIdToString(subject.id))
      .join(",");

    async function fetchTopics() {
      setIsTopicsLoading(true);

      try {
        const response = await api.get("/filtros/topicos", {
          params: { assuntos: subjectIdsString },
          headers: authHeaders(laravelToken),
        });

        if (cancelled) return;

        const availableTopics = normalizeFilterOptions(response.data);

        setTopics(availableTopics);
        setSelectedTopicsState((current) =>
          keepOnlyExistingOptions(safeArray(current), availableTopics),
        );
      } catch (error) {
        console.error("Erro ao buscar tópicos:", error);

        if (!cancelled) {
          setTopics([]);
          setSelectedTopicsState([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionIdsKey(selectedSubjects), laravelToken, topicOptionsKey]);

  /**
   * Cascata: prova -> ano.
   *
   * Se selecionar ENEM, busca:
   * /filtros/anos-provas?provas=ENEM
   *
   * Se selecionar ENEM,FUVEST, busca:
   * /filtros/anos-provas?provas=ENEM,FUVEST
   */
  useEffect(() => {
    if (!laravelToken) return;

    let cancelled = false;

    const safeSelectedExams = safeArray(selectedExams);

    async function fetchYears() {
      setIsYearsLoading(true);

      try {
        const provaSiglas = safeSelectedExams
          .map((exam) => optionIdToString(exam.id))
          .filter(Boolean)
          .join(",");

        const response = await api.get("/filtros/anos-provas", {
          params: provaSiglas ? { provas: provaSiglas } : {},
          headers: authHeaders(laravelToken),
        });

        if (cancelled) return;

        const availableYears = normalizeFilterOptions(response.data);

        setYears(availableYears);
        setSelectedYearsState((current) =>
          keepOnlyExistingOptions(safeArray(current), availableYears),
        );
      } catch (error) {
        console.error("Erro ao buscar anos por prova:", error);

        if (!cancelled) {
          setYears([]);
          setSelectedYearsState([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionIdsKey(selectedExams), laravelToken]);

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
    setSelectedFrontsState([]);
    setSelectedExamsState([]);
    setSelectedSubjectsState([]);
    setSelectedTopicsState([]);
    setSelectedYearsState([]);

    setSubjects(safeArray(subjectOptions));
    setTopics(safeArray(topicOptions));
    setYears(safeArray(yearOptions));

    setWantsComments(false);
    setQuestionStatus("all");
    setCorrectStatus("all");
  }

  function getCurrentPayload(): FilterPanelPayload {
    const toIds = (items: FilterOption[]) =>
      safeArray(items)
        .map((item) => optionIdToString(item.id))
        .filter(Boolean);

    return {
      frentes: toIds(selectedFronts),
      provas: toIds(selectedExams),
      assuntos: toIds(selectedSubjects),
      topicos: toIds(selectedTopics),
      anos: toIds(selectedYears),
      com_comentarios: wantsComments,
      status: questionStatus,
      acerto: questionStatus === "not-solved" ? "all" : correctStatus,
    };
  }

  function handleSearch() {
    const payload = getCurrentPayload();

    if (onSubmitFilters) {
      onSubmitFilters(payload);
      return;
    }

    const pathSegments: string[] = [];

    const addMultiSelectToPath = (key: string, items: string[]) => {
      if (items.length === 0) return;

      pathSegments.push(key);
      pathSegments.push(
        items.map((item) => encodeURIComponent(item)).join(","),
      );
    };

    addMultiSelectToPath("frente", payload.frentes);
    addMultiSelectToPath("prova", payload.provas);
    addMultiSelectToPath("assunto", payload.assuntos);
    addMultiSelectToPath("topico", payload.topicos);
    addMultiSelectToPath("ano", payload.anos);

    const queryParams = new URLSearchParams();

    if (payload.com_comentarios) {
      queryParams.set("com_comentarios", "true");
    }

    if (payload.status !== "all") {
      queryParams.set("status", payload.status);
    }

    if (payload.status !== "not-solved" && payload.acerto !== "all") {
      queryParams.set("acerto", payload.acerto);
    }

    queryParams.set("page", "1");

    const finalPath = pathSegments.join("/");
    const searchUrl = finalPath
      ? `/exercicios/s/${finalPath}`
      : "/exercicios/s";

    const queryString = queryParams.toString();

    router.push(`${searchUrl}${queryString ? `?${queryString}` : ""}`);
  }

  const safeSelectedFronts = safeArray(selectedFronts);
  const safeSelectedSubjects = safeArray(selectedSubjects);
  const safeSelectedExams = safeArray(selectedExams);

  const safeSubjects = safeArray(subjects);
  const safeTopics = safeArray(topics);
  const safeYears = safeArray(years);

  const isSubjectDisabled =
    isSubjectsLoading ||
    (safeSelectedFronts.length === 0 && safeSubjects.length === 0);

  const isTopicDisabled =
    isTopicsLoading ||
    (safeSelectedSubjects.length === 0 && safeTopics.length === 0);

  const isYearDisabled = isYearsLoading || safeYears.length === 0;

  const isCorrectDisabled = questionStatus === "not-solved";

  return (
    <div className="mb-6 rounded-lg bg-[#1D232D] p-6 shadow-md">
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Coluna 1: Frente + Prova */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-base font-medium text-white">
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
            <label className="mb-2 block text-base font-medium text-white">
              Prova(s)
            </label>

            <HeadlessMultiSelect
              placeholder="Ex.: ENEM, FUVEST, UNICAMP"
              options={safeArray(exams)}
              selectedOptions={safeSelectedExams}
              onChange={setSelectedExams}
              isLoading={isExamLoading}
            />
          </div>
        </div>

        {/* Coluna 2: Assunto + Ano */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-base font-medium text-white">
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
            <label className="mb-2 block text-base font-medium text-white">
              Ano(s)
            </label>

            <HeadlessMultiSelect
              placeholder={
                safeSelectedExams.length > 0
                  ? "Anos disponíveis da(s) prova(s)"
                  : "Selecione o(s) ano(s)"
              }
              options={safeYears}
              selectedOptions={safeArray(selectedYears)}
              onChange={setSelectedYears}
              disabled={isYearDisabled}
              isLoading={isYearsLoading}
            />
          </div>
        </div>

        {/* Coluna 3: Tópico + Opções */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-base font-medium text-white">
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
            <label className="mb-2 block text-base font-medium text-white">
              Opções
            </label>

            <label
              htmlFor="gabarito-comentado"
              className={`flex h-12 cursor-pointer items-center rounded-md border p-3 transition ${
                wantsComments
                  ? "border-[#0E00D0] bg-[#0E00D0]/10"
                  : "border-gray-700 bg-[#2A303C] hover:border-gray-500"
              }`}
            >
              <input
                id="gabarito-comentado"
                type="checkbox"
                checked={wantsComments}
                onChange={(event) => setWantsComments(event.target.checked)}
                className="h-5 w-5 cursor-pointer rounded border-gray-600 bg-gray-700 text-[#0E00D0] accent-[#0E00D0] focus:ring-2 focus:ring-[#0E00D0] focus:ring-offset-0"
              />

              <span
                className={`ml-3 text-base font-medium ${
                  wantsComments ? "text-white" : "text-gray-300"
                }`}
              >
                Gabarito comentado
              </span>
            </label>
          </div>
        </div>

        {/* Coluna 4: Questões que */}
        <div className="flex h-full flex-col">
          <label className="mb-2 block text-base font-medium text-white">
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
              className={getButtonClass(questionStatus === "solved", "blue")}
              onClick={() => handleQuestionStatusClick("solved")}
            >
              Resolvi
            </button>

            <button
              type="button"
              disabled={isCorrectDisabled}
              className={getButtonClass(correctStatus === "correct", "green")}
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
              className={getButtonClass(correctStatus === "incorrect", "red")}
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

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSearch}
          className="cursor-pointer inline-flex h-10 min-w-[92px] items-center justify-center rounded-md bg-[#0E00D0] px-4 text-sm font-semibold text-white transition hover:bg-[#1A0DFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>

        <button
          type="button"
          onClick={clearAllFilters}
          className="cursor-pointer inline-flex h-10 min-w-[92px] items-center justify-center rounded-md border border-[#303A4F] bg-[#202735] px-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};
