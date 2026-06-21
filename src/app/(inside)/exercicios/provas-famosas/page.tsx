"use client";

import { useState } from "react";
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { Search } from "lucide-react";
import ProvasFamosasPanel from "@/components/questions/ProvasFamosasPanel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ProvasFamosas() {
  const [searchTerm, setSearchTerm] = useState("");

  useDocumentTitle("Provas Famosas");

  return (
    <>
      <ExercisesHeader />

      <div className="min-h-screen bg-[#00091A] p-4 text-white sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />

              <input
                type="text"
                placeholder="Buscar provas..."
                className="w-full rounded-lg border border-gray-700 bg-[#1e293b] py-3 pl-12 pr-4 text-white placeholder-gray-400 transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-[#0E00D0]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ProvasFamosasPanel searchTerm={searchTerm} />
        </div>
      </div>
    </>
  );
}
