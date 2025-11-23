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
  // 1. Espera terminar o carregamento inicial
  if (initialLoading) return;

  // 2. Garante que o módulo certo foi carregado no store
  if (loadedModuloId !== moduloId) return;

  // 3. Evita redirecionamento duplo
  if (hasRedirected) return;

  // 4. Só segue se houver conteúdos
  if (!contents || contents.length === 0) return;

  // 5. Encontrar a primeira aula NÃO concluída
  const firstUncompleted = contents.find(
    (lesson) => !lesson.user_progress?.is_completed
  );

  // 6. Fallback: se todas concluídas, vai para a primeira do módulo
  const targetLesson = firstUncompleted ?? contents[0];

  // 7. Gerar slug
  const slug = toSlug(targetLesson.title);

  // 8. Montar URL final
  const url = `/modulos/${moduloId}/${moduloSlug}/${targetLesson.id}/${slug}`;

  console.log("🔥 Redirecionando para:", url);

  // 9. Marcar como redirecionado e enviar
  setHasRedirected(true);
  router.replace(url);

}, [
  initialLoading,
  contents,
  loadedModuloId,
  moduloId,
  moduloSlug,
  hasRedirected,
  router
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