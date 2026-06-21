// src/lib/users/roles.ts
import { api } from "@/lib/axios";

export interface UserRole {
  id?: number;
  name?: string | null;
  slug?: string | null;
  display_name?: string | null;
  description?: string | null;
  priority?: number | null;
  is_staff?: boolean | number | null;
  is_active?: boolean | number | null;
}

export interface UserRolesResponse {
  roles: UserRole[];
  role: UserRole | null;
}

export const getMyRoles = async (
  token: string
): Promise<UserRolesResponse> => {
  const response = await api.get<UserRolesResponse>("/user/roles", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};