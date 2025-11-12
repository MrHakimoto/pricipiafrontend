import { api } from '@/lib/axios';

type FilterOption = { id: number; nome: string; };

/**
 * Busca os objetos completos de um tipo de filtro com base em uma lista de IDs.
 * Usado para "hidratar" as seleções vindas da URL.
 */
export async function getFilterOptionsByIds(filterType: string, ids: string[] | undefined, token: string): Promise<FilterOption[]> {
  if (!ids || ids.length === 0 || !token) return [];
 
  try {
    const response = await api.get(`/filtros/${filterType}?ids=${ids.join(',')}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar opções para ${filterType} por IDs:`, error);
    return [];
  }
}

// ==================================================================
// FUNÇÃO ADICIONADA
// ==================================================================
/**
 * Busca a lista de Assuntos que pertencem a uma ou mais Frentes.
 * Usado para popular as OPÇÕES do dropdown de Assuntos na página de resultados.
 */
export async function getAssuntosByFrentes(frenteIds: string | undefined, token: string): Promise<FilterOption[]> {
    if (!frenteIds || !token) return [];
    try {
        const response = await api.get(`/filtros/assuntos?frentes=${frenteIds}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar assuntos por frentes:", error);
        return [];
    }
}

// ==================================================================
// FUNÇÃO ADICIONADA
// ==================================================================
/**
 * Busca a lista de Tópicos que pertencem a um ou mais Assuntos.
 * Usado para popular as OPÇÕES do dropdown de Tópicos na página de resultados.
 */
export async function getTopicosByAssuntos(assuntoIds: string | undefined, token: string): Promise<FilterOption[]> {
    if (!assuntoIds || !token) return [];
    try {
        const response = await api.get(`/filtros/topicos?assuntos=${assuntoIds}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar tópicos por assuntos:", error);
        return [];
    }
}


/**
 * Busca a lista final de questões com base em todos os filtros aplicados.
 */
export async function getFilteredQuestions(
    pathFilters: { [key: string]: string[] },
    queryFilters: { [key: string]: string },
    token: string
): Promise<any> {
    if (!token) return { data: [] };
    
    try {
        const params = new URLSearchParams();
        for (const key in pathFilters) {
            if (pathFilters[key]?.length > 0) {
                params.append(key, pathFilters[key].join(','));
            }
        }
        for (const key in queryFilters) {
            if (queryFilters[key]) {
                params.append(key, queryFilters[key]!);
            }
        }
        
        const response = await api.get('/questoes', { 
            params: params,
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar questões:", error);
        return { data: [] };
    }
}