//hook/useImageUpload.ts
"use client";

import { useState, useRef } from "react";

// Tipo para o retorno da API
type UploadResponse = {
  url: string;
};

// Tipo da função callback que recebe o arquivo selecionado
type OnFileSelected = (file: File) => void;

// Tipo da função callback após upload bem-sucedido
type OnUploadSuccess = (url: string) => void;

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Função genérica de upload
  const uploadImage = async (file: File): Promise<string> => {
    if (!file) throw new Error("Nenhum arquivo selecionado");

    if (!file.type.startsWith("image/")) {
      throw new Error("Por favor, selecione um arquivo de imagem válido.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem deve ter no máximo 5MB.");
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error || `Erro no upload: ${response.status}`);
      }

      const result = (await response.json()) as UploadResponse;

      if (!result.url) {
        throw new Error("URL da imagem não retornada pelo servidor");
      }

      return result.url;
    } catch (error: any) {
      console.error("Erro no upload:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Lida com seleção de arquivo
  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    onFileSelected?: OnFileSelected
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (onFileSelected) {
      onFileSelected(file);
    } else {
      setEditingImageFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Abre o seletor de arquivo
  const openFileSelector = () => {
    
    fileInputRef.current?.click();
  };

  // Para usar um editor antes do upload
  const handleImageWithEditor = async (
    file: File,
    _onSuccess?: OnUploadSuccess
  ) => {
    setEditingImageFile(file);
  };

  // Confirma o upload após edição
  const confirmImageUpload = async (
    editedFile: File,
    onSuccess?: OnUploadSuccess
  ): Promise<string> => {
    try {
      const imageUrl = await uploadImage(editedFile);
      onSuccess?.(imageUrl);
      setEditingImageFile(null);
      return imageUrl;
    } catch (error: any) {
      alert(`Erro ao fazer upload da imagem: ${error.message}`);
      throw error;
    }
  };

  return {
    // Estados
    isUploading,
    editingImageFile,

    // Refs
    fileInputRef,

    // Funções
    uploadImage,
    handleFileSelect,
    openFileSelector,
    handleImageWithEditor,
    confirmImageUpload,

    // Setters
    setEditingImageFile,
  };
};
