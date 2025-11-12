// modulos/[moduloId]/[moduloSlug]/page.tsx
"use client";

import { Skeleton } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useModuloStore } from "@/store/useModuloStore";

export default function ModuloRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const { moduloId, moduloSlug } = params as { moduloId: string; moduloSlug: string };

  // Estados do store
  const contents = useModuloStore((state) => state.contents);
  const initialLoading = useModuloStore((state) => state.initialLoading);
  const loadedModuloId = useModuloStore((state) => state.loadedModuloId);

  // Estado local para controlar redirecionamento
  const [hasRedirected, setHasRedirected] = useState(false);

  function toSlug(str: string) {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  useEffect(() => {
    // Condições mais rigorosas para redirecionamento
    const shouldRedirect = 
      !initialLoading && 
      !hasRedirected && 
      loadedModuloId === moduloId && 
      contents.length > 0;

    console.log("=== CONDIÇÕES DE REDIRECIONAMENTO ===");
    console.log("initialLoading:", initialLoading);
    console.log("hasRedirected:", hasRedirected);
    console.log("loadedModuloId:", loadedModuloId);
    console.log("moduloId:", moduloId);
    console.log("contents.length:", contents.length);
    console.log("shouldRedirect:", shouldRedirect);

    if (shouldRedirect) {
      const primeiro = contents[0];
      const redirectUrl = `/modulos/${moduloId}/${moduloSlug}/${primeiro.id}/${toSlug(primeiro.title)}`;
      
      console.log(" REDIRECIONANDO PARA:", redirectUrl);
      
      setHasRedirected(true); // Marca como redirecionado
      router.replace(redirectUrl);
    } else if (!initialLoading && contents.length === 0 && !hasRedirected) {
      console.log(" Módulo vazio ou sem conteúdos.");
      // router.replace("/home");
    }
  }, [
    initialLoading, 
    contents, 
    moduloId, 
    moduloSlug, 
    router, 
    hasRedirected,
    loadedModuloId
  ]);

  // Log para debug
  useEffect(() => {
    console.log("🔄 Estado atual do redirecionamento:", {
      initialLoading,
      contentsLength: contents.length,
      hasRedirected,
      loadedModuloId,
      currentModuloId: moduloId
    });
  }, [initialLoading, contents.length, hasRedirected, loadedModuloId, moduloId]);

  return (
    <div className="p-6">
      <Skeleton className="h-64 w-full mb-4" />
      <Skeleton className="h-6 w-1/3 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}