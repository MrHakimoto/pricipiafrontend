"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FileText, Clock, Mail, XCircle, Square } from "lucide-react";
import Link from "next/link";

export default function ListCard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full bg-[#0f172a] rounded-2xl p-5 shadow-lg border border-gray-800 relative"
      >
        {/* Voltar */}
        <Link href="#" className="absolute -top-10 left-0 text-gray-400 text-sm hover:text-white flex items-center gap-1">
          <ArrowLeft size={16} /> Voltar
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileText className="text-blue-500" size={16} />
            <span>Minhas Listas</span>
          </div>

          <h2 className="text-lg font-semibold">Minha lista fofinha :)</h2>

          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <div className="flex items-center gap-1">
              <Clock size={14} /> <span>≈ 19 min</span>
            </div>
            <span className="bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">Médio</span>
          </div>
        </div>

        {/* Tag */}
        <div className="mt-3">
          <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-lg">
            Geometria
          </span>
        </div>

        {/* Estatísticas */}
        <div className="flex items-center gap-2 mt-3 text-sm">
          <div className="flex items-center gap-1 text-green-400">
            <Mail size={14} /> 2
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <XCircle size={14} /> 2
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Square size={14} /> 0
          </div>
        </div>

        {/* Barras de progresso */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-green-500 h-3 rounded-full"></div>
          <div className="flex-1 bg-red-500 h-3 rounded-full"></div>
        </div>

        {/* Números */}
        <div className="flex gap-2 justify-center mt-3">
          <div className="bg-gray-800 text-green-400 px-3 py-1 rounded-md text-sm font-semibold">1</div>
          <div className="bg-gray-800 text-red-400 px-3 py-1 rounded-md text-sm font-semibold">2</div>
          <div className="bg-gray-800 text-green-400 px-3 py-1 rounded-md text-sm font-semibold">3</div>
          <div className="bg-gray-800 text-red-400 px-3 py-1 rounded-md text-sm font-semibold">4</div>
        </div>

        {/* Botão PDF */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-pink-600 hover:bg-pink-700 mt-5 py-2 rounded-xl font-medium flex items-center justify-center gap-2 text-sm"
        >
          Gerar PDF da lista <span className="bg-white text-pink-600 px-2 py-0.5 rounded-md text-xs font-bold">PDF</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
