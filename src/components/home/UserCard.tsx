'use client'

import { Star, MapPin } from 'lucide-react'
import Link from 'next/link'

type Props = {
  nome: string | null
}

export default function UserCard({ nome }: Props) {
  return (
    <div className="relative border border-gray-700 rounded-2xl pl-10 py-8 shadow-lg h-30">
      {/* Topo - Nome e avatar */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-black dark:bg-[#DBD9D9] flex items-center justify-center text-2xl">
          👤
        </div>
        <div>
          <h3 className="font-bold text-xl">{nome}</h3>
        </div>
      </div>

      {/* Inferior direito */}
      <div className="absolute text-dark dark:text-white bottom-0 right-0 px-4 py-3 bg-[#d7d7d7] dark:bg-[#1B1F27] rounded-tl-2xl rounded-br-2xl flex items-center gap-6 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-dark dark:text-white font-semibold"><span className="w-8 h-8 bg-[#0E00D0] text-white p-1 rounded-full text-sm font-semibold">
            19</span> π</span>
        </div>

        <div className="flex items-center gap-1 text-black dark:text-gray-300">
          <Star size={16} className="text-yellow-400" />
          <span>Nível 7</span>
        </div>

        <div className="flex items-center gap-1 text-black dark:text-gray-300">
          <MapPin size={16} className="text-purple-400" />
          <span>Ranking 1</span>
        </div>

        <Link href={'/perfil'}>
          <button className="cursor-pointer text-white bg-[#8F8F8F] dark:bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
            Meu Perfil
          </button>
        </Link>
      </div>

    </div>

  )
}
