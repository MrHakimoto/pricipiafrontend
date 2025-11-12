'use server';

import { api } from '@/lib/axios';

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  try {
    const res = await api.post('/register', formData);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || 'Erro desconhecido' };
  }
}