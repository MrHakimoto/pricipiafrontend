// components/questions/CurseList.tsx

"use client";

import ListaResolverMotor from "@/components/questions/resolver/ListaResolverMotor";

interface ListaCursePageProps {
  idList: number;
}

export default function ListaCursePage({ idList }: ListaCursePageProps) {
  const safeListId = Number(idList);

  if (!safeListId || Number.isNaN(safeListId)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-6 text-white">
        <h2 className="text-lg font-bold">Lista não encontrada</h2>

        <p className="mt-2 text-sm text-slate-400">
          Este conteúdo não possui uma lista vinculada.
        </p>
      </div>
    );
  }

  return (
    <ListaResolverMotor
      listaId={safeListId}
      variant="embedded"
      debugLabel="Lista de curso"
      tituloLoading="Carregando lista do módulo..."
    />
  );
}