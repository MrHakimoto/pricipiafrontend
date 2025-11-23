import { api } from "../axios";

export interface UserProfile {
  id?: string;
  user_id?: string;
  name?: string;
  birth_date?: string;
  gender?: string;
  cpf?: string;
  phone?: string;
  avatar?: string;
}

export const linkGoogleAccount = async (token: string, googleData: { email: string; google_id: string; avatar?: string }) => {
  try {
    const response = await api.post("/user/link-google", googleData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error("Erro ao vincular Google:", error.response?.data || error.message);
    throw error; // Lança o erro para o componente mostrar o Toast
  }
};

export const unlinkGoogleAccount = async (token: string) => {
  try {
    const response = await api.post("/user/unlink-google", {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error("Erro ao desvincular Google:", error.response?.data || error.message);
    // Repassa o erro para o componente mostrar (ex: "Defina uma senha antes")
    throw error; 
  }
};


export const checkGoogleStatus = async (token: string): Promise<boolean> => {
  try {
    const response = await api.get<{ is_linked: boolean }>("/user/google-status", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.is_linked;
  } catch (error) {
    return false;
  }
};

/** Busca o perfil do usuário logado */
export const fetchMyProfile = async (token: string): Promise<UserProfile | null> => {
  try {
    const response = await api.get<UserProfile>("/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao buscar perfil:", error);
    throw new Error("Falha ao buscar o perfil.");
  }
};

export const setPassword = async (token: string, data: string) => {
  try {
    const response = await api.post("/setPassword", { password: data, password_confirmation: data }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao buscar perfil:", error);
    throw new Error("Falha ao buscar o perfil.");
  }
};


/** Cria ou atualiza o perfil do usuário logado */
export const saveMyProfile = async (dados: UserProfile, token: string): Promise<UserProfile> => {
  try {
    if (dados.id) {
      const response = await api.put<UserProfile>(
        `/user-profiles/${dados.id}`,
        {
          name: dados.name,
          birth_date: dados.birth_date,
          gender: dados.gender,
          cpf: dados.cpf,
          phone: dados.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } else {
      const response = await api.post<UserProfile>(
        "/user-profiles",
        {
          user_id: dados.user_id,
          birth_date: formatarDataParaISO(dados.birth_date),
          gender: dados.gender,
          cpf: dados.cpf,
          phone: dados.phone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    }
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error.response?.data || error.message);
    throw new Error("Falha ao salvar o perfil.");
  }
};

const formatarDataParaISO = (dataBR?: string | null): string | null => {
  if (!dataBR) return null;
  const partes = dataBR.split("/");
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes}-${dia}`;
};



export const salvarAvatar = async (token: string, id: string | number, avatar: string) => {
  try {
    const response = await api.post("/salvarAvatar", { user_id: id, avatar: avatar }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao setar o avatar:", error);
    throw new Error("Falha ao setar o novo avatar.");
  }
};



export const removerAvatar = async (token: string, id: string | number) => {
  try {
    const response = await api.post("/removerAvatar", { user_id: id }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error("Erro ao remover o avatar:", error);
    throw new Error("Falha ao remover o avatar.");
  }
};
