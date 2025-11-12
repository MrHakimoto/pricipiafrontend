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
              <div className="relative group rounded-xl overflow-hidden shadow-lg cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                {/* IMAGEM */}
                <img
                  src={item.content_avatar || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col md:flex-row items-start gap-4 p-6">
                  {/* BOTÃO PLAY */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="bg-[#C6005C] p-3 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110">
                      <Play className="text-white w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>

                  {/* BLOCO DE INFORMAÇÕES */}
                  <div className="flex-1 flex flex-col gap-3">
                    <h2 className="text-white font-semibold text-lg md:text-xl">{item.name}</h2>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-1">
                      {/* Duração total */}
                      <div className="bg-[#1F2937] rounded-md p-3 text-center">
                        <p className="text-2xl md:text-3xl font-bold">{item.statistics.total_duration_formatted}</p>
                        <p className="text-sm text-gray-300 mt-1">Duração total</p>
                      </div>

                      {/* Aulas */}
                      <div className="bg-[#1F2937] rounded-md p-3 text-center">
                        <p className="text-2xl md:text-3xl font-bold">{item.statistics.aulas_count}</p>
                        <p className="text-sm text-gray-300 mt-1">aulas | {item.statistics.aulas_duration_formatted}</p>
                      </div>

                      {/* Listas */}
                      <div className="bg-[#1F2937] rounded-md p-3 text-center">
                        <p className="text-2xl md:text-3xl font-bold">{item.statistics.listas_count}</p>
                        <p className="text-sm text-gray-300 mt-1">listas | {item.statistics.listas_duration_formatted}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOME DO CURSO ABAIXO */}
                <div className="p-4 bg-[#111827]">
                  <h3 className="text-white font-medium text-lg truncate">{item.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
