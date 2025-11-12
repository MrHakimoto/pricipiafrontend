"use client";
import { useState } from "react";
import { questions } from "@/utils/db";
import { ModelQuestions } from "@/components/questions/ModelQuestions"
import { FilterPanel } from "@/components/Panel/PanelFilter"
import { ExercisesHeader } from "@/components/questions/ExercisesHeader"

import { MoreVertical, Plus } from "lucide-react";

interface List {
    id: number;
    name: string;
    color: string;
}

export default function MinhasListas() {

    const [lists, setLists] = useState<List[]>([
        { id: 1, name: "Minha lista fofinha :)", color: "bg-gray-300" },
    ]);
    return (
        <div className="min-h-screen bg-[#00091A]">
            <ExercisesHeader></ExercisesHeader>
            <div className="p-6">
                {/* Barra de pesquisa */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Pesquisar uma lista específica"
                        className="w-full max-w-xl px-4 py-3 rounded-lg  text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Grid de listas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {/* Renderiza listas existentes */}
                    {lists.map((list) => (
                        <div
                            key={list.id}
                            className="relative cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
                        >
                            {/* Fundo do card */}
                            <div
                                className={`h-40 rounded-lg  ${list.color} flex items-center justify-center`}
                            >
                                <span className="text-xl font-bold bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center">
                                    {list.name.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            {/* Botão de opções */}
                            <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-[#161B22] rounded-full p-1 hover:bg-gray-700 transition">
                                <MoreVertical size={16} />
                            </button>

                            {/* Nome da lista */}
                            <p className="text-center mt-3 text-sm font-medium">{list.name}</p>
                        </div>
                    ))}

                    {/* Card de criar lista */}
                    <button
                        onClick={() =>
                            setLists([
                                ...lists,
                                {
                                    id: lists.length + 1,
                                    name: `Nova lista ${lists.length + 1}`,
                                    color: "bg-gray-700",
                                },
                            ])
                        }
                        className="h-40 cursor-pointer flex flex-col items-center justify-center rounded-lg bg-[#161B22] border border-dashed border-gray-600 hover:border-gray-400 transition-colors duration-300"
                    >
                        <Plus size={28} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Criar Lista</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
