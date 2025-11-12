// src/lib/axios.ts
import axios from "axios";
import { signOut } from "next-auth/react";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    
    if (error.response && error.response.status === 401) {
      console.error("ERRO 401: Não autenticado. Deslogando e redirecionando para o login...");
      
      signOut();
    }
    
    return Promise.reject(error);
  }
);