// src/components/ForumSkeleton.tsx
import React from "react";

export default function ForumSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-100 text-black dark:bg-[#00091A] dark:text-white font-sans">
      {/* Título (barra) */}
      <div className="px-4 sm:px-6 md:px-8 py-6 bg-neutral-200 dark:bg-[#1B1F27] border-b border-neutral-300 dark:border-gray-700">
        <div className="h-6 w-40 sm:w-72 md:w-[720px] bg-neutral-300 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Main container */}
      <div className="container mx-auto px-4 sm:px-10 md:px-20 lg:px-40 py-8">
        {/* Barra de pesquisa */}
        <div className="px-2 sm:px-4 md:px-6 py-4 space-y-4">
          <p className="text-sm text-neutral-500 dark:text-gray-400"></p>

          <div className="relative">
            <div className="h-10 w-full pl-10 pr-4 rounded-md border border-neutral-300 dark:border-[#26313b] bg-white dark:bg-[#07101a]" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-neutral-300 dark:bg-gray-700" />
          </div>

          {/* Postar dúvida */}
          <div className="flex gap-2">
            <div className="px-4 py-2 border border-neutral-300 dark:border-[#26313b] bg-neutral-200 dark:bg-[#1B1F27] flex-1 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="h-6 w-40 sm:w-80 bg-neutral-300 dark:bg-gray-700 rounded" />
              <div className="h-10 w-24 sm:w-32 bg-neutral-300 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>

        {/* Filtro */}
        <div className="px-2 sm:px-4 md:px-6 py-2">
          <div className="h-8 w-24 sm:w-36 bg-neutral-300 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Lista */}
        <div className="px-2 sm:px-4 md:px-6 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-neutral-300 dark:border-[#2F3541] rounded-md p-4 flex flex-col cursor-pointer bg-neutral-200 dark:bg-[#0b1116] animate-pulse"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-gray-700" />
                  <div className="h-4 w-24 sm:w-40 bg-neutral-300 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-4 w-20 sm:w-28 bg-neutral-300 dark:bg-gray-700 rounded" />
              </div>

              {/* Conteúdo */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 pr-0 sm:pr-4 w-full">
                  <div className="h-4 w-2/3 sm:w-3/4 bg-neutral-300 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-4 w-1/3 sm:w-1/2 bg-neutral-300 dark:bg-gray-700 rounded" />
                </div>

                {/* ID (lado direito, cai para baixo no mobile) */}
                <div className="w-full sm:w-auto bg-neutral-300 dark:bg-[#1B1F27] rounded-md px-3 py-3 flex flex-col gap-2">
                  <div className="h-5 w-24 sm:w-28 bg-neutral-400 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-32 sm:w-40 bg-neutral-400 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
