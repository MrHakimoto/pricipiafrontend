// exercicios/s/[[...slug]]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { FilterPanel } from "@/components/Panel/PanelFilter";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { ModelQuestions } from "@/components/questions/ModelQuestions";

import {
  getAnosByProvas,
  getAssuntosByFrentes,
  getFilteredQuestions,
  getFilterOptionsByIds,
  getTopicosByAssuntos,
} from "@/lib/filtra";

type FilterOption = {
  id: number | string;
  nome: string;
};

type PathFilters = {
  frente?: string[];
  prova?: string[];
  assunto?: string[];
  topico?: string[];
  ano?: string[];
};

type QueryFilters = {
  status?: string;
  acerto?: string;
  com_comentarios?: string;
  page?: string;
  per_page?: string;
};

type LaravelPaginatedResponse<T = any> = {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
};

const VALID_PATH_KEYS = new Set([
  "frente",
  "prova",
  "assunto",
  "topico",
  "ano",
]);

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeSlugParam(slug: unknown): string[] {
  if (!slug) return [];

  if (Array.isArray(slug)) {
    return slug
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof slug === "string") {
    return [slug.trim()].filter(Boolean);
  }

  return [];
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseExerciseSlug(slug: string[]): PathFilters {
  const filters: PathFilters = {};

  for (let i = 0; i < slug.length; i += 2) {
    const key = slug[i];
    const rawValue = slug[i + 1];

    if (!key || !rawValue) continue;
    if (!VALID_PATH_KEYS.has(key)) continue;

    const values = rawValue
      .split(",")
      .map((value) => safeDecode(value.trim()))
      .filter(Boolean);

    if (values.length === 0) continue;

    filters[key as keyof PathFilters] = values;
  }

  return filters;
}

function pathFiltersKey(filters: PathFilters): string {
  return JSON.stringify({
    frente: filters.frente ?? [],
    prova: filters.prova ?? [],
    assunto: filters.assunto ?? [],
    topico: filters.topico ?? [],
    ano: filters.ano ?? [],
  });
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
      return value.replace(/^Bearer\s+/i, "").trim();
    }
  }

  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return cookieToken ? decodeURIComponent(cookieToken) : "";
}

function sanitizeStatus(value: string | null): string | undefined {
  if (!value || value === "all") return undefined;

  if (value === "solved" || value === "not-solved") {
    return value;
  }

  return undefined;
}

function sanitizeAcerto(
  value: string | null,
  status?: string,
): string | undefined {
  if (!value || value === "all") return undefined;

  if (status === "not-solved") return undefined;

  if (value === "correct" || value === "incorrect") {
    return value;
  }

  return undefined;
}

function yearOptionsFromIds(ids?: string[]): FilterOption[] {
  return safeArray(ids)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0)
    .map((year) => ({
      id: year,
      nome: String(year),
    }));
}

export default function FilteredExercisesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const sessionToken = useMemo(() => {
    return (
      (session as any)?.laravelToken ||
      (session as any)?.accessToken ||
      (session as any)?.user?.laravelToken ||
      ""
    );
  }, [session]);

  const token = useMemo(() => {
    return String(sessionToken || getClientToken() || "")
      .replace(/^Bearer\s+/i, "")
      .trim();
  }, [sessionToken]);

  const [questionsResponse, setQuestionsResponse] =
    useState<LaravelPaginatedResponse | null>(null);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isHydratingFilters, setIsHydratingFilters] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [initialSelectedFronts, setInitialSelectedFronts] = useState<
    FilterOption[]
  >([]);

  const [initialSelectedExams, setInitialSelectedExams] = useState<
    FilterOption[]
  >([]);

  const [initialSelectedSubjects, setInitialSelectedSubjects] = useState<
    FilterOption[]
  >([]);

  const [initialSelectedTopics, setInitialSelectedTopics] = useState<
    FilterOption[]
  >([]);

  const [initialSelectedYears, setInitialSelectedYears] = useState<
    FilterOption[]
  >([]);

  const [subjectOptions, setSubjectOptions] = useState<FilterOption[]>([]);
  const [topicOptions, setTopicOptions] = useState<FilterOption[]>([]);
  const [yearOptions, setYearOptions] = useState<FilterOption[]>([]);

  const slug = useMemo(() => {
    return normalizeSlugParam(params?.slug);
  }, [params?.slug]);

  const pathFilters = useMemo(() => {
    return parseExerciseSlug(slug);
  }, [slug]);

  const pathKey = useMemo(() => {
    return pathFiltersKey(pathFilters);
  }, [pathFilters]);

  const queryFilters: QueryFilters = useMemo(() => {
    const status = sanitizeStatus(searchParams.get("status"));
    const acerto = sanitizeAcerto(searchParams.get("acerto"), status);

    return {
      status,
      acerto,
      com_comentarios: searchParams.get("com_comentarios") ?? undefined,
      page: searchParams.get("page") ?? "1",
      per_page: searchParams.get("per_page") ?? "20",
    };
  }, [searchParams]);

  const queryKey = useMemo(() => {
    return JSON.stringify(queryFilters);
  }, [queryFilters]);

  const wantsComments = queryFilters.com_comentarios === "true";

  /**
   * Hidrata as seleções vindas da URL.
   *
   * Exemplo:
   * /exercicios/s/prova/ENEM/ano/2020
   *
   * Agora:
   * - prova usa /filtros/provas-grupos
   * - ano usa /filtros/anos-provas
   */
  const hydrateFilters = useCallback(async () => {
    if (!token) {
      setIsHydratingFilters(false);
      return;
    }

    setIsHydratingFilters(true);

    try {
      const provaSiglas = pathFilters.prova?.join(",");

      const [
        hydratedFronts,
        hydratedExams,
        hydratedSubjects,
        hydratedTopics,
        availableYears,
      ] = await Promise.all([
        getFilterOptionsByIds("frentes", pathFilters.frente, token),
        getFilterOptionsByIds("provas-grupos", pathFilters.prova, token),
        getFilterOptionsByIds("assuntos", pathFilters.assunto, token),
        getFilterOptionsByIds("topicos", pathFilters.topico, token),
        getAnosByProvas(provaSiglas, token),
      ]);

      const requestedYearIds = new Set(
        safeArray(pathFilters.ano).map((year) => String(Number(year))),
      );

      const availableYearOptions = safeArray(availableYears);

      const hydratedYears =
        requestedYearIds.size > 0
          ? availableYearOptions.filter((year) =>
              requestedYearIds.has(String(year.id)),
            )
          : [];

      const finalHydratedYears =
        availableYearOptions.length > 0
          ? hydratedYears
          : yearOptionsFromIds(pathFilters.ano);

      setInitialSelectedFronts(safeArray(hydratedFronts));
      setInitialSelectedExams(safeArray(hydratedExams));
      setInitialSelectedSubjects(safeArray(hydratedSubjects));
      setInitialSelectedTopics(safeArray(hydratedTopics));
      setInitialSelectedYears(finalHydratedYears);

      setYearOptions(
        availableYearOptions.length > 0
          ? availableYearOptions
          : finalHydratedYears,
      );

      /**
       * Carrega opções de assuntos/tópicos para não deixar o seletor vazio
       * quando a página já abre a partir de uma URL filtrada.
       */
      if (pathFilters.frente?.length) {
        const options = await getAssuntosByFrentes(
          pathFilters.frente.join(","),
          token,
        );

        setSubjectOptions(safeArray(options));
      } else {
        setSubjectOptions(safeArray(hydratedSubjects));
      }

      if (pathFilters.assunto?.length) {
        const options = await getTopicosByAssuntos(
          pathFilters.assunto.join(","),
          token,
        );

        setTopicOptions(safeArray(options));
      } else {
        setTopicOptions(safeArray(hydratedTopics));
      }
    } catch (error) {
      console.error("Erro ao hidratar filtros da URL:", error);

      setInitialSelectedFronts([]);
      setInitialSelectedExams([]);
      setInitialSelectedSubjects([]);
      setInitialSelectedTopics([]);
      setInitialSelectedYears([]);
      setSubjectOptions([]);
      setTopicOptions([]);
      setYearOptions([]);
    } finally {
      setIsHydratingFilters(false);
    }
  }, [pathKey, token]);

  const fetchQuestions = useCallback(async () => {
    if (sessionStatus === "loading") return;

    if (!token) {
      setQuestionsResponse(null);
      setIsLoadingQuestions(false);
      setErrorMessage(
        "Não foi possível carregar as questões porque o token de autenticação não foi encontrado.",
      );
      return;
    }

    setIsLoadingQuestions(true);
    setErrorMessage(null);

    try {
      const response = await getFilteredQuestions(
        pathFilters,
        queryFilters,
        token,
      );

      setQuestionsResponse(response);
    } catch (error) {
      console.error("Erro ao carregar questões filtradas:", error);

      setErrorMessage("Não foi possível carregar as questões filtradas.");
      setQuestionsResponse(null);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [sessionStatus, token, pathKey, queryKey]);

  useEffect(() => {
    hydrateFilters();
  }, [hydrateFilters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function goToPage(page: number) {
    const lastPage = questionsResponse?.last_page ?? 1;
    const safePage = Math.min(Math.max(page, 1), lastPage);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("page", String(safePage));

    router.push(`?${nextParams.toString()}`);
  }

  const questions = questionsResponse?.data ?? [];
  const isLoading = isLoadingQuestions || isHydratingFilters;

  return (
    <div className="min-h-screen bg-white dark:bg-[#00091A]">
      <ExercisesHeader />

      <main className="mx-auto mt-5 max-w-6xl px-4 pb-12">
        <FilterPanel
          key={`${pathKey}-${queryKey}`}
          initialSelectedFronts={initialSelectedFronts}
          initialSelectedExams={initialSelectedExams}
          initialSelectedSubjects={initialSelectedSubjects}
          initialSelectedTopics={initialSelectedTopics}
          initialSelectedYears={initialSelectedYears}
          initialWantsComments={wantsComments}
          initialQuestionStatus={queryFilters.status ?? "all"}
          initialCorrectStatus={queryFilters.acerto ?? "all"}
          subjectOptions={subjectOptions}
          topicOptions={topicOptions}
          yearOptions={yearOptions}
        />

        <section className="mt-6">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="space-y-4">
                <div className="h-5 w-56 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
                <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
                <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
              </div>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {errorMessage}
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Nenhuma questão encontrada
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Altere os filtros selecionados para ampliar a busca.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Exibindo{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {questionsResponse?.from ?? 0}
                  </strong>{" "}
                  até{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {questionsResponse?.to ?? 0}
                  </strong>{" "}
                  de{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {questionsResponse?.total ?? 0}
                  </strong>{" "}
                  questões.
                </span>

                <span>
                  Página{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {questionsResponse?.current_page ?? 1}
                  </strong>{" "}
                  de{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {questionsResponse?.last_page ?? 1}
                  </strong>
                </span>
              </div>

              <ModelQuestions questions={questions} meta={questionsResponse} />

              {questionsResponse && questionsResponse.last_page > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={questionsResponse.current_page <= 1}
                    onClick={() => goToPage(questionsResponse.current_page - 1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
                  >
                    Anterior
                  </button>

                  {questionsResponse.links
                    .filter((link) => {
                      const label = link.label.toLowerCase();

                      return (
                        !label.includes("previous") &&
                        !label.includes("next") &&
                        Number.isFinite(Number(link.label))
                      );
                    })
                    .map((link, index) => {
                      const page = Number(link.label);

                      return (
                        <button
                          key={`${link.label}-${index}`}
                          type="button"
                          onClick={() => goToPage(page)}
                          className={[
                            "rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition",
                            link.active
                              ? "border-[#0e00d0] bg-[#0e00d0] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]",
                          ].join(" ")}
                        >
                          {link.label}
                        </button>
                      );
                    })}

                  <button
                    type="button"
                    disabled={
                      questionsResponse.current_page >=
                      questionsResponse.last_page
                    }
                    onClick={() => goToPage(questionsResponse.current_page + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
