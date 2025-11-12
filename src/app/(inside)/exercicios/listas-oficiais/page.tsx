"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { motion, easeInOut  } from 'framer-motion';
import Image from 'next/image';
import { Search, Compass, Loader2 } from 'lucide-react';
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { getListOficial } from '@/lib/questions/list'; // Ajuste o caminho se necessário
import Link from 'next/link';

// --- Configurações de animação para os cards ---
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: easeInOut,
    },
  }),
};

type Lista = {
  id: number;
  name: string;
  descricao?: string;
};

const cardHover = {
  scale: 1.03,
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
  transition: { type: 'spring', stiffness: 400, damping: 17 }
};

export default function ListaDeExercicios() {
  // CORREÇÃO: Ordem do useState corrigida e estados adicionados
  const [isLoading, setIsLoading] = useState(true);
const [allListas, setAllListas] = useState<Lista[]>([]); // Guarda a lista original da API
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  // Efeito para buscar os dados da API
  useEffect(() => {
    const getDados = async () => {
      if (status === 'authenticated' && session.laravelToken) {
        try {
          setIsLoading(true);
          const token = session.laravelToken;
          
          const response = await getListOficial(token);
          // Assumindo que a API retorna um objeto de paginação
          setAllListas(response.data || response); 
          
        } catch (err) {
          setError("Falha ao carregar as listas.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
          setError("Você precisa estar logado para ver as listas.");
          setIsLoading(false);
      }
    };
    
    // Roda a busca apenas quando o status da sessão não estiver 'loading'
    if (status !== 'loading') {
        getDados();
    }

  }, [session, status]); // CORREÇÃO: useEffect agora depende da sessão

  // Lógica para filtrar as listas com base na busca
  const filteredListas = allListas.filter(lista => 
    lista.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading || status === 'loading') {
    return (
        <div className="flex justify-center items-center min-h-screen bg-[#00091A]">
            <Loader2 className="animate-spin text-white" size={48} />
        </div>
    );
  }

  if (error) {
      return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  console.log(filteredListas)
  return (
    <>
      <ExercisesHeader />
      <div className="bg-[#00091A] min-h-screen p-4 sm:p-8 md:p-16 text-white font-sans">
        <div className="max-w-7xl mx-auto">
          {/* --- Barra de Busca --- */}
          <div className="relative mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar uma lista específica..."
              className="w-full bg-[#1e293b] border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* --- Grid de Listas --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* CORREÇÃO: Mapeando a lista filtrada 'filteredListas' */}
            {filteredListas.map((lista, index) => (
              <Link key={lista.id} href={`listas-oficiais/${lista.id}`}>
              <motion.div
                key={lista.id} // É melhor usar o ID da lista como chave
                className="bg-[#1e293b] rounded-xl overflow-hidden cursor-pointer flex flex-col"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={cardHover}
              >
                {/* Imagem do Card */}
                <div className="relative h-40 bg-black flex items-center justify-center">
                  <Image
                    src="/images/card-bg.png" // Garanta que esta imagem existe na sua pasta /public
                    alt="Fundo do card"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-50"
                  />
                  <div className="z-10 text-center text-white p-2">
                    <Compass size={48} className="mx-auto mb-2" />
                    <span className="font-bold tracking-widest text-sm">PRINCIPIA MATEMÁTICA</span>
                  </div>
                </div>

                {/* Título do Card */}
                <div className="p-4 flex-grow flex items-center">
                  {/* Assumindo que o nome da lista na API é 'name' */}
                  <h2 className="text-lg font-semibold text-gray-200">{lista.name}</h2>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}