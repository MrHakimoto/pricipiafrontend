import { api } from "../axios"; // Sua instância do Axios

/**
 * Busca os banners ativos para serem exibidos ao aluno.
 * Rota: GET /api/banners (a rota pública que criámos)
 *
 * @sends (Envia)
 * - (Nada, é uma requisição GET pública)
 *
 * @receives (Recebe)
 * - Promise<Array<{
 * id: number,
 * title: string | null,
 * image_url: string,
 * link_url: string | null,
 * target_blank: boolean
 * }>>
 */


export const fetchActiveBanners = async (token: string) => {
  try {
    // Chama a rota PÚBLICA /api/banners
    const response = await api.get("/banners", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // O backend (Api/BannerController) já faz todo o filtro
    // de banners ativos, agendados e ordenados.
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar banners:", error.response?.data || error.message);
    // Retorna um array vazio em caso de erro para não quebrar a UI
    return []; 
  }
};