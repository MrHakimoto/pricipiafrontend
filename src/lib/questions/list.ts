// lib/questions/list.ts

import { api } from "../axios";

export type PdfLayoutQuestoes = "colunas" | "sequencial";
export type PdfFontSize = "P" | "M" | "G";

export type ListaPdfParams = {
  layoutQuestoes?: PdfLayoutQuestoes;
  fontSize?: PdfFontSize;
  showTopicos?: boolean;
  showDificuldade?: boolean;
  showGabarito?: boolean;

  fileName?: string;

  url?: string;
  titulo?: string;
  subtitulo?: string;
  courseTitle?: string;
  coverKind?: string;
};

/* ============================================================
  LISTAS
============================================================ */

export const getListOficial = async (token: string): Promise<any> => {
  if (!token) return { data: [] };

  try {
    const response = await api.get("/listas/oficiais", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar listas oficiais:", error);
    return { data: [] };
  }
};

export const getListaById = async (
  id: number,
  token: string,
): Promise<any> => {
  if (!token) return { data: [] };

  try {
    const response = await api.get(`/listas/${id}/questoes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar questões da lista:", error);
    return { data: [] };
  }
};

/* ============================================================
  PREVIEW JSON DA LISTA
  GET /listas/{lista}/preview
============================================================ */

export const getListaPreview = async (
  listaId: number,
  token: string,
): Promise<any> => {
  if (!token) return null;

  try {
    const response = await api.get(`/listas/${listaId}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar preview da lista:", error);
    return null;
  }
};

/* ============================================================
  PDF PARAMS
============================================================ */

function buildPdfParams(params?: ListaPdfParams): Record<string, string> {
  return {
    layoutQuestoes: params?.layoutQuestoes || "colunas",
    layout: params?.layoutQuestoes || "colunas",

    fontSize: params?.fontSize || "M",
    font: params?.fontSize || "M",

    showTopicos: params?.showTopicos === false ? "0" : "1",
    showDificuldade: params?.showDificuldade ? "1" : "0",
    showGabarito: params?.showGabarito === false ? "0" : "1",

    url: params?.url || "",
    titulo: params?.titulo || "",
    title: params?.titulo || "",
    subtitulo: params?.subtitulo || "",
    subtitle: params?.subtitulo || "",
    courseTitle: params?.courseTitle || "",
    coverKind: params?.coverKind || "",
  };
}

/* ============================================================
  SANITIZAR NOME DO ARQUIVO
============================================================ */

function sanitizeFileName(value: string, fallback = "lista.pdf"): string {
  const sanitized = String(value || "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) return fallback;

  return sanitized.toLowerCase().endsWith(".pdf")
    ? sanitized
    : `${sanitized}.pdf`;
}

/* ============================================================
  PEGAR NOME DO ARQUIVO PELO HEADER
============================================================ */

function getFilenameFromDisposition(disposition?: string): string | null {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const normalMatch = disposition.match(/filename="?([^"]+)"?/i);

  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return null;
}

/* ============================================================
  FORÇAR DOWNLOAD DO BLOB
============================================================ */

function forceDownloadBlob(blob: Blob, filename: string): void {
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

/* ============================================================
  BAIXAR PDF DA LISTA
  GET /listas/{lista}/pdf
============================================================ */

export const downloadListaPdf = async (
  listaId: number,
  token: string,
  params?: ListaPdfParams,
): Promise<boolean> => {
  if (!token) return false;

  try {
    const response = await api.get(`/listas/${listaId}/pdf`, {
      params: buildPdfParams(params),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
      responseType: "blob",
    });

    const contentType = response.headers["content-type"];

    if (contentType && !String(contentType).includes("application/pdf")) {
      console.error("A resposta não parece ser um PDF:", contentType);
      return false;
    }

    const headerFilename = getFilenameFromDisposition(
      response.headers["content-disposition"],
    );

    const filename = sanitizeFileName(
      params?.fileName || headerFilename || `lista-${listaId}.pdf`,
      `lista-${listaId}.pdf`,
    );

    const pdfBlob = new Blob([response.data], {
      type: "application/pdf",
    });

    forceDownloadBlob(pdfBlob, filename);

    return true;
  } catch (error) {
    console.error("Erro ao baixar PDF da lista:", error);
    return false;
  }
};