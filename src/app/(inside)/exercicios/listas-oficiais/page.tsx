"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { motion, easeInOut  } from 'framer-motion';
import Image from 'next/image';
import { Search, Compass, Loader2 } from 'lucide-react';
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { getListOficial } from '@/lib/questions/list';
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
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
  },
};

export default function ListaDeExercicios() {
  const [isLoading, setIsLoading] = useState(true);
  const [allListas, setAllListas] = useState<Lista[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  // Efeito para buscar os dados da API
  useEffect(() => {
    const getDados = async () => {
      if (status === 'authenticated' && session?.laravelToken) {
        try {
          setIsLoading(true);
          setError(null);
          const token = session.laravelToken;
          
          const response = await getListOficial(token);
          console.log('Resposta da API:', response);
          
          // CORREÇÃO: Tratamento seguro da resposta da API
          let listasData: Lista[] = [];
          
          if (Array.isArray(response)) {
            // Se a resposta é diretamente um array
            listasData = response;
          } else if (response && Array.isArray(response.data)) {
            // Se a resposta tem propriedade data que é array
            listasData = response.data;
          } else if (response && response.lista_info && Array.isArray(response.lista_info)) {
            // Se a resposta tem lista_info que é array
            listasData = response.lista_info;
          } else {
            console.warn('Estrutura de resposta inesperada:', response);
            listasData = [];
          }
          
          setAllListas(listasData);
          
        } catch (err) {
          console.error('Erro ao carregar listas:', err);
          setError("Falha ao carregar as listas.");
          setAllListas([]); // Garantir que seja array vazio
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setError("Você precisa estar logado para ver as listas.");
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    
    if (status !== 'loading') {
      getDados();
    }

  }, [session, status]);

  // CORREÇÃO: Garantir que allListas seja sempre um array antes de usar filter
  const safeListas = Array.isArray(allListas) ? allListas : [];

  // Lógica para filtrar as listas com base na busca
  const filteredListas = safeListas.filter(lista => 
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
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  console.log('Listas filtradas:', filteredListas);
  
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

          {/* Mensagem quando não há listas */}
          {filteredListas.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Compass size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'Nenhuma lista encontrada para sua pesquisa.' : 'Nenhuma lista disponível no momento.'}
              </p>
            </div>
          )}

          {/* --- Grid de Listas --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredListas.map((lista, index) => (
              <Link key={lista.id} href={`listas-oficiais/${lista.id}`}>
                <motion.div
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
                      src="/images/card-bg.png"
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