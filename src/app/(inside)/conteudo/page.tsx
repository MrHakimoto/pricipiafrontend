"use client";

import { api } from "@/lib/axios";
import { Skeleton } from "@mui/material";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";

export default function ConteudoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { data: session } = useSession();

  useEffect(() => {
    api
      .get(`/courses`, {
        headers: {
          Authorization: `Bearer ${session?.laravelToken}`,
        },
      })
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      });
  }, [session?.laravelToken]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <div className="bg-[#D7D7D7] dark:bg-[#1B1F27] px-8 py-8 mt-10 mb-10">
        <div className="flex flex-wrap gap-2 items-center">
          <h1 className="text-3xl font-bold dark:text-white text-black">Conteúdo</h1>
          <span className="text-3xl font-bold dark:text-white text-black">|</span>
          <p className="dark:text-white text-black text-lg sm:text-xl">
            Explore todo o conteúdo por meio dos cursos produzidos pelo Principia Matemática.
          </p>
        </div>
      </div>

      {/* GRID DE CURSOS */}
      <div className="px-6 md:px-10 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {data.map((item: any) => (
            <Link key={item.id} href={`/conteudo/tv/${item.id}`}>
              <div className="relative group rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl bg-gradient-to-br from-gray-900 to-black">

                {/* CONTAINER DA IMAGEM */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.content_avatar || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* GRADIENT OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-300" />
                </div>

                {/* OVERLAY INTERATIVO */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C6005C]/20 to-[#1F2937]/90 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-6">

                  {/* CARD DE INFORMAÇÕES */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm border border-white/20 shadow-2xl">

                    {/* BOTÃO PLAY DESTACADO */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-[#C6005C] to-[#FF0080] p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group/btn">
                        <Play className="text-white w-6 h-6 group-hover/btn:scale-110 transition-transform" fill="white" />
                      </div>
                    </div>

                    {/* ESTATÍSTICAS DO CURSO */}
                    <div className="space-y-3">
                      {/* DURAÇÃO TOTAL */}
                      <div className="text-center p-3 bg-black/40 rounded-xl border border-white/10">
                        <p className="text-3xl font-bold text-white mb-1">{item.statistics.total_duration_formatted}</p>
                        <p className="text-xs text-gray-300 uppercase tracking-wider">Duração Total</p>
                      </div>

                      {/* AULAS */}
                      <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-left">
                          <p className="text-2xl font-bold text-white">{item.statistics.aulas_count}</p>
                          <p className="text-xs text-gray-400">Aulas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-300">{item.statistics.aulas_duration_formatted}</p>
                        </div>
                      </div>

                      {/* LISTAS */}
                      <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-left">
                          <p className="text-2xl font-bold text-white">{item.statistics.listas_count}</p>
                          <p className="text-xs text-gray-400">Listas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-300">{item.statistics.listas_duration_formatted}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DO CARD */}
                <div className="p-5 bg-gradient-to-r from-[#1F2937] to-[#111827] border-t border-white/10">
                  <h3 className="text-white font-semibold text-lg truncate text-center group-hover:text-[#FF0080] transition-colors duration-300">
                    {item.name}
                  </h3>
                  <div className="flex justify-center mt-2">
                    <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                      Clique para explorar
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
