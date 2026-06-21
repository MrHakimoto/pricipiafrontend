// lib/filtra.ts
import { api } from "@/lib/axios";

export type FilterOption = {
  id: number | string;
  nome: string;
};

type PathFilters = {
  frente?: string[];
  prova?: string[];
  assunto?: string[];
  topico?: string[];
  ano?: string[];
  [key: string]: string[] | undefined;
};

type QueryFilters = {
  status?: string;
  acerto?: string;
  com_comentarios?: string;
  page?: string;
  per_page?: string;
  [key: string]: string | undefined;
};

function normalizeToken(token: string | undefined | null): string {
  if (!token) return "";

  return String(token)
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function authHeaders(token: string) {
  const cleanToken = normalizeToken(token);

  if (!cleanToken) return {};

  return {
    Authorization: `Bearer ${cleanToken}`,
  };
}

/**
 * IDs numéricos:
 * frente, assunto, tópico, ano.
 */
function safeNumericIds(ids: string[] | undefined): string[] {
  if (!Array.isArray(ids)) return [];

  return ids
    .map((id) => String(id).trim())
    .filter(Boolean)
    .filter((id) => /^\d+$/.test(id));
}

/**
 * IDs textuais:
 * provas agrupadas por sigla: ENEM, FUVEST, ENEM PPL etc.
 */
function safeStringIds(ids: string[] | undefined): string[] {
  if (!Array.isArray(ids)) return [];

  return ids
    .map((id) => {
      try {
        return decodeURIComponent(String(id).trim());
      } catch {
        return String(id).trim();
      }
    })
    .filter(Boolean);
}

/**
 * Busca os objetos completos de um tipo de filtro com base em uma lista de IDs.
 *
 * Exemplos:
 * getFilterOptionsByIds("frentes", ["1", "2"], token)
 * getFilterOptionsByIds("assuntos", ["11"], token)
 * getFilterOptionsByIds("topicos", ["42", "40"], token)
 * getFilterOptionsByIds("provas-grupos", ["ENEM", "FUVEST"], token)
 * getFilterOptionsByIds("anos-provas", ["2020", "2021"], token)
 */
export async function getFilterOptionsByIds(
  filterType: string,
  ids: string[] | undefined,
  token: string,
): Promise<FilterOption[]> {
  const cleanToken = normalizeToken(token);

  const cleanIds =
    filterType === "provas-grupos"
      ? safeStringIds(ids)
      : safeNumericIds(ids);

  if (cleanIds.length === 0 || !cleanToken) {
    return [];
  }

  try {
    const response = await api.get(`/filtros/${filterType}`, {
      params: {
        ids: cleanIds.join(","),
      },
      headers: authHeaders(cleanToken),
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Erro ao buscar opções para ${filterType} por IDs:`, error);
    return [];
  }
}

/**
 * Busca a lista de Assuntos que pertencem a uma ou mais Frentes.
 */
export async function getAssuntosByFrentes(
  frenteIds: string | undefined,
  token: string,
): Promise<FilterOption[]> {
  const cleanToken = normalizeToken(token);

  if (!frenteIds || !cleanToken) {
    return [];
  }

  try {
    const response = await api.get("/filtros/assuntos", {
      params: {
        frentes: frenteIds,
      },
      headers: authHeaders(cleanToken),
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar assuntos por frentes:", error);
    return [];
  }
}

/**
 * Busca a lista de Tópicos que pertencem a um ou mais Assuntos.
 */
export async function getTopicosByAssuntos(
  assuntoIds: string | undefined,
  token: string,
): Promise<FilterOption[]> {
  const cleanToken = normalizeToken(token);

  if (!assuntoIds || !cleanToken) {
    return [];
  }

  try {
    const response = await api.get("/filtros/topicos", {
      params: {
        assuntos: assuntoIds,
      },
      headers: authHeaders(cleanToken),
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar tópicos por assuntos:", error);
    return [];
  }
}

/**
 * Busca anos disponíveis para as provas selecionadas.
 *
 * Exemplo:
 * getAnosByProvas("ENEM,FUVEST", token)
 *
 * Chama:
 * /filtros/anos-provas?provas=ENEM,FUVEST
 */
export async function getAnosByProvas(
  provaSiglas: string | undefined,
  token: string,
): Promise<FilterOption[]> {
  const cleanToken = normalizeToken(token);

  if (!cleanToken) {
    return [];
  }

  try {
    const response = await api.get("/filtros/anos-provas", {
      params: provaSiglas
        ? {
            provas: provaSiglas,
          }
        : {},
      headers: authHeaders(cleanToken),
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar anos por provas:", error);
    return [];
  }
}

/**
 * Busca a lista final de questões com base em todos os filtros aplicados.
 */
export async function getFilteredQuestions(
  pathFilters: PathFilters,
  queryFilters: QueryFilters,
  token: string,
): Promise<any> {
  const cleanToken = normalizeToken(token);

  if (!cleanToken) {
    return {
      current_page: 1,
      data: [],
      from: null,
      last_page: 1,
      links: [],
      next_page_url: null,
      path: "",
      per_page: Number(queryFilters.per_page ?? 20),
      prev_page_url: null,
      to: null,
      total: 0,
    };
  }

  try {
    const params = new URLSearchParams();

    const pathToApiMap: Record<string, string> = {
      frente: "frentes",
      prova: "provas",
      assunto: "assuntos",
      topico: "topicos",
      ano: "anos",
    };

    for (const [pathKey, apiKey] of Object.entries(pathToApiMap)) {
      const values =
        pathKey === "prova"
          ? safeStringIds(pathFilters[pathKey])
          : safeNumericIds(pathFilters[pathKey]);

      if (values.length > 0) {
        params.set(apiKey, values.join(","));
      }
    }

    if (queryFilters.com_comentarios === "true") {
      params.set("com_gabarito_comentado", "true");
    }

    if (queryFilters.status && queryFilters.status !== "all") {
      params.set("status", queryFilters.status);
    }

    /**
     * Acerto só faz sentido para questões resolvidas.
     * Se status=not-solved, acerto precisa ser ignorado.
     */
    if (
      queryFilters.acerto &&
      queryFilters.acerto !== "all" &&
      queryFilters.status !== "not-solved"
    ) {
      params.set("acerto", queryFilters.acerto);
    }

    params.set("page", queryFilters.page ?? "1");
    params.set("per_page", queryFilters.per_page ?? "20");

    const response = await api.get("/questoes", {
      params,
      headers: authHeaders(cleanToken),
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar questões:", error);

    return {
      current_page: 1,
      data: [],
      from: null,
      last_page: 1,
      links: [],
      next_page_url: null,
      path: "",
      per_page: Number(queryFilters.per_page ?? 20),
      prev_page_url: null,
      to: null,
      total: 0,
    };
  }
}