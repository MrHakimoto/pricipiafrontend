import { api } from "../axios"; // Seu ficheiro de configuração do Axios

/**
 * Busca o perfil do utilizador logado.
 * Retorna os dados do perfil ou null se não existir.
 */
export const fetchMyProfile = async (token) => {
    try {
        // Rota dedicada para o perfil do utilizador logado
        const response = await api.get("/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return null; // Indica que não há perfil
        }

        console.error("Erro ao buscar perfil:", error);
        throw new Error("Falha ao buscar o perfil.");
    }
};
/**
 * Cria ou atualiza o perfil do utilizador logado.
 * - Se o perfil já existir, faz UPDATE (PUT /user-profiles/:id)
 * - Caso contrário, faz CREATE (POST /user-profiles)
 */
export const saveMyProfile = async (dados, token) => {
    try {
        // Se vier "id", atualiza; senão, cria novo perfil
        if (dados.id) {
            const response = await api.put(`/user-profiles/${dados.id}`, {
                name: dados.name,
                birth_date: dados.birth_date,
                gender: dados.gender,
                cpf: dados.cpf,
                phone: dados.phone,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return response.data;
        } else {
            const response = await api.post("/user-profiles", {
                user_id: dados.user_id || dados.id,
                birth_date: formatarDataParaISO(dados.nascimento),
                gender: dados.genero,
                cpf: dados.cpf,
                phone: dados.celular,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return response.data;
        }
    } catch (error) {
        console.error("Erro ao salvar perfil:", error.response?.data || error.message);
        throw new Error("Falha ao salvar o perfil.");
    }
};

/** Converte "DD/MM/AAAA" → "AAAA-MM-DD" */
const formatarDataParaISO = (dataBR) => {
    if (!dataBR) return null;
    const partes = dataBR.split("/");
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`;
};

/** Converte os valores do select para o backend */
const mapearGeneroParaBackend = (genero) => {
    switch (genero) {
        case "masculino":
            return "M";
        case "feminino":
            return "F";
        case "nao-informar":
        default:
            return "O";
    }
};
