"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, SearchX } from "lucide-react";

export default function InsideNotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0B1220] p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
          <SearchX className="h-8 w-8" />
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
          Erro 404
        </p>

        <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">
          Página não encontrada
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
          Essa página não existe, foi movida ou o endereço está incompleto.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <Link
            href="/conteudo/tv"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Ir para os cursos
          </Link>
        </div>
      </div>
    </div>
  );
}