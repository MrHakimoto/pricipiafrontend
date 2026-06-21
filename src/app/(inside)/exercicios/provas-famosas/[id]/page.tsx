// provas-famosas/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import ListaResolverMotor from "@/components/questions/resolver/ListaResolverMotor";


export default function ProvaFamosaResolverPage() {
  const params = useParams();
  const router = useRouter();

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const listaId = Number(idParam);

  if (!listaId || Number.isNaN(listaId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#00091A] p-8">
        <div className="text-center text-white">
          <div className="mb-4 text-xl">ID da prova não encontrado.</div>

          <button
            onClick={() => router.push("/provas-famosas")}
            className="rounded-lg bg-blue-600 px-6 py-2 transition-colors hover:bg-blue-700"
          >
            Voltar para Provas
          </button>
        </div>
      </div>
    );
  }

  return (
    <ListaResolverMotor
      listaId={listaId}
      modoForcado="simulado"
      variant="page"
      debugLabel="Prova famosa"
      tituloLoading="Carregando prova..."
      paddingTopMobile
    />
  );
}