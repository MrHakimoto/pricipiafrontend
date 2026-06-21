//exercicios/listas-oficiais/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import ListaResolverMotor from "@/components/questions/resolver/ListaResolverMotor";

export default function ListaOficialPage() {
  const params = useParams();

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const listaId = Number(idParam);

  return (
    <ListaResolverMotor
      listaId={listaId}
      debugLabel="Listas oficiais"
      tituloLoading="Carregando lista oficial..."
      paddingTopMobile
    />
  );
}