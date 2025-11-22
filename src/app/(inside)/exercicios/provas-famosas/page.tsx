// provas-famosas/page.tsx
"use client";
import { useState } from "react";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { Search } from "lucide-react";
import ProvasFamosasPanel from "@/components/questions/ProvasFamosasPanel";

export default function ProvasFamosas() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <ExercisesHeader />
      <div className="bg-[#00091A] min-h-screen p-4 sm:p-8 text-white font-sans">
        <div className="max-w-7xl mx-auto">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar provas..."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E60076] transition-shadow duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Painel de Provas Famosas */}
          <ProvasFamosasPanel />
        </div>
      </div>
    </>
  );
}