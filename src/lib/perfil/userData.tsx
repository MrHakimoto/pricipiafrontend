// lib/perfil/userData.ts
import { api } from "../axios";
export { getLevelTitle } from "@/lib/gamification/levels";

// ============================================================================
// TYPES
// ============================================================================

export interface UserRole {
  id: number;
  name: string;
  slug: string;
  display_name?: string | null;
  description?: string | null;
  priority?: number | null;
  is_staff?: boolean | number | null;
  is_active?: boolean | number | null;
}

export interface UserGamification {
  user_id?: number | null;
  current_points?: number | null;
  current_level?: number | null;
  current_streak?: number | null;
  level_title?: string | null;
}

export interface UserProfile {
  id?: number | null;
  user_id?: number | null;

  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  has_password?: boolean | null;

  birth_date?: string | null;
  gender?: string | null;
  cpf?: string | null;
  phone?: string | null;

  roles?: UserRole[];
  role?: UserRole | null;
  gamification?: UserGamification | null;

  created_at?: string | null;
  updated_at?: string | null;

  subscription?: UserSubscription | null;
  access?: UserAccess | null;

  member_since?: string | null;
  profile_created_at?: string | null;
}

export interface GoogleLinkData {
  email: string;
  google_id: string;
  avatar?: string;
}

export type UserSubscription = {
  id?: number | null;
  status?: string | null;
  product_name?: string | null;
  plan?: string | null;
  subscription_id?: string | null;
  last_payment_at?: string | null;
  access_expires_at?: string | null;
  is_active?: boolean | null;
  days_remaining?: number | null;
};

export type UserAccess = {
  can_access_courses?: boolean | null;
  is_staff?: boolean | null;
  has_active_subscription?: boolean | null;
  reason?: string | null;
};

// ============================================================================
// HELPERS
// ============================================================================

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
});

const assertToken = (token: string) => {
  if (!token) {
    throw new Error("Token não fornecido.");
  }
};

const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const normalizeEmpty = (value?: string | null): string | null => {
  const clean = value?.trim();

  return clean ? clean : null;
};

export const formatarDataParaISO = (data?: string | null): string | null => {
  if (!data) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return data;
  }

  if (data.includes("T")) {
    return data.split("T")[0];
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    const [dia, mes, ano] = data.split("/");

    return `${ano}-${mes}-${dia}`;
  }

  return null;
};

const normalizeRole = (role?: UserRole | null): UserRole | null => {
  if (!role) return null;

  return {
    ...role,
    id: Number(role.id),
    priority:
      role.priority === null || role.priority === undefined
        ? null
        : Number(role.priority),
  };
};

const normalizeRoles = (roles?: UserRole[] | null): UserRole[] => {
  if (!Array.isArray(roles)) return [];

  return roles
    .filter(Boolean)
    .map((role) => normalizeRole(role))
    .filter(Boolean)
    .sort(
      (a, b) => Number(b?.priority ?? 0) - Number(a?.priority ?? 0),
    ) as UserRole[];
};

const normalizeProfile = (profile: UserProfile): UserProfile => {
  const roles = normalizeRoles(profile.roles);
  const primaryRole = normalizeRole(profile.role) ?? roles[0] ?? null;

  return {
    ...profile,

    id:
      profile.id === null || profile.id === undefined
        ? null
        : Number(profile.id),
    user_id:
      profile.user_id === null || profile.user_id === undefined
        ? null
        : Number(profile.user_id),

    name: profile.name ?? null,
    email: profile.email ?? null,
    avatar: profile.avatar ?? null,
    has_password:
      profile.has_password === null || profile.has_password === undefined
        ? null
        : Boolean(profile.has_password),

    birth_date: formatarDataParaISO(profile.birth_date),
    gender: profile.gender ?? null,
    cpf: profile.cpf ?? null,
    phone: profile.phone ?? null,

    roles,
    role: primaryRole,
    gamification: profile.gamification ?? null,

    created_at: profile.created_at ?? null,
    updated_at: profile.updated_at ?? null,
  };
};

const buildProfilePayload = (dados: UserProfile) => {
  return {
    name: normalizeEmpty(dados.name),
    birth_date: formatarDataParaISO(dados.birth_date),
    gender: normalizeEmpty(dados.gender),
    cpf: normalizeEmpty(dados.cpf),
    phone: normalizeEmpty(dados.phone),
  };
};

// ============================================================================
// GOOGLE ACCOUNT
// ============================================================================

export const linkGoogleAccount = async (
  token: string,
  googleData: GoogleLinkData,
) => {
  assertToken(token);

  try {
    const response = await api.post("/user/link-google", googleData, {
      headers: authHeaders(token),
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao vincular Google:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

export const unlinkGoogleAccount = async (token: string) => {
  assertToken(token);

  try {
    const response = await api.post(
      "/user/unlink-google",
      {},
      {
        headers: authHeaders(token),
      },
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao desvincular Google:",
      error.response?.data || error.message,
    );

    throw error;
  }
};

export const checkGoogleStatus = async (token: string): Promise<boolean> => {
  if (!token) return false;

  try {
    const response = await api.get<{ is_linked: boolean }>(
      "/user/google-status",
      {
        headers: authHeaders(token),
      },
    );

    return Boolean(response.data.is_linked);
  } catch {
    return false;
  }
};

// ============================================================================
// PROFILE
// ============================================================================

export const fetchMyProfile = async (
  token: string,
): Promise<UserProfile | null> => {
  if (!token) return null;

  try {
    const response = await api.get<UserProfile>("/user/profile", {
      headers: authHeaders(token),
    });

    return normalizeProfile(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) return null;

    console.error(
      "Erro ao buscar perfil:",
      error.response?.data || error.message,
    );

    throw new Error(getErrorMessage(error, "Falha ao buscar o perfil."));
  }
};

export const saveMyProfile = async (
  dados: UserProfile,
  token: string,
): Promise<UserProfile> => {
  assertToken(token);

  try {
    const response = await api.put<UserProfile>(
      "/user/profile",
      buildProfilePayload(dados),
      {
        headers: authHeaders(token),
      },
    );

    return normalizeProfile(response.data);
  } catch (error: any) {
    console.error(
      "Erro ao salvar perfil:",
      error.response?.data || error.message,
    );

    throw new Error(getErrorMessage(error, "Falha ao salvar o perfil."));
  }
};

// ============================================================================
// PASSWORD
// ============================================================================

export const setPassword = async (token: string, password: string) => {
  assertToken(token);

  if (!password?.trim()) {
    throw new Error("Senha não fornecida.");
  }

  try {
    const response = await api.post(
      "/setPassword",
      {
        password,
        password_confirmation: password,
      },
      {
        headers: authHeaders(token),
      },
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Erro ao definir senha:",
      error.response?.data || error.message,
    );

    throw new Error(getErrorMessage(error, "Falha ao definir a senha."));
  }
};

// ============================================================================
// AVATAR
// ============================================================================

export const salvarAvatar = async (
  token: string,
  id: string | number,
  avatar: string,
) => {
  assertToken(token);

  if (!id) throw new Error("ID do usuário não fornecido.");
  if (!avatar?.trim()) throw new Error("Avatar não fornecido.");

  try {
    const response = await api.post(
      "/salvarAvatar",
      {
        user_id: id,
        avatar,
      },
      {
        headers: authHeaders(token),
      },
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;

    console.error(
      "Erro ao salvar avatar:",
      error.response?.data || error.message,
    );

    throw new Error(getErrorMessage(error, "Falha ao salvar o novo avatar."));
  }
};

export const removerAvatar = async (token: string, id: string | number) => {
  assertToken(token);

  if (!id) throw new Error("ID do usuário não fornecido.");

  try {
    const response = await api.post(
      "/removerAvatar",
      {
        user_id: id,
      },
      {
        headers: authHeaders(token),
      },
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;

    console.error(
      "Erro ao remover avatar:",
      error.response?.data || error.message,
    );

    throw new Error(getErrorMessage(error, "Falha ao remover o avatar."));
  }
};

// ============================================================================
// PROFILE HELPERS FOR UI
// ============================================================================

export const getPrimaryRole = (
  profile?: UserProfile | null,
): UserRole | null => {
  if (!profile) return null;

  return profile.role ?? profile.roles?.[0] ?? null;
};
