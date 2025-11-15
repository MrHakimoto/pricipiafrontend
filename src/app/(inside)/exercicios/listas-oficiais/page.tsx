"use client";

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { motion, easeInOut } from 'framer-motion';
import { Search, BookOpen, Clock, CheckCircle, Loader2, PlayCircle, Target, Tag } from 'lucide-react';
import { ExercisesHeader } from "@/components/questions/ExercisesHeader";
import { getListOficial } from '@/lib/questions/list';
import Link from 'next/link';
import ConteudoSkeleton from '@/components/Skeletons/ConteudoSkeleton';

// --- Sub-componente: Barra de Progresso Circular ---


interface CircularProgressProps {
  progress: number;
  status: string;
}

const CircularProgress = ({ progress, status }: CircularProgressProps) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-emerald-500';
      case 'in-progress':
        return 'text-blue-500';
      case 'pending':
      default:
        return 'text-amber-500';
    }
  };

  const color = getStatusColor();
  const progressText = status === 'completed' ? '100%' : `${Math.round(progress)}%`;

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="w-full h-full" viewBox="0 0 80 80">
        <circle
          className="text-slate-700"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
        />
        <motion.circle
          className={color}
          strokeWidth="4"
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="40"
          cy="40"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className={`absolute flex flex-col items-center justify-center ${color}`}>
        {status === 'completed' ? (
          <CheckCircle size={18} />
        ) : (
          <span className="text-sm font-bold">
            {progressText}
          </span>
        )}
      </div>
    </div>
  );
};

// --- Configurações de animação ---
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

const cardHover = {
  scale: 1.05,
  y: -2,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
  },
};

type Resolucao = {
  id: number;
  user_id: number;
  lista_id: number;
  tentativa_numero: number;
  status: 'iniciado' | 'concluido' | 'pausado';
  score_final: number | null;
  total_questoes: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  respostas_count: number;
};

type Lista = {
  id: number;
  name: string;
  descricao?: string;
  time: number;
  questoes_count: number;
  tipo: string;
  frentes: Array<{ nome: string }>;
  assuntos: Array<{ nome: string }>;
  topicos: Array<{ nome: string }>;
  user?: {
    name: string;
  };
  resolucoes: Resolucao[];
};

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed';

export default function ListaDeExercicios() {
  const [isLoading, setIsLoading] = useState(true);
  const [allListas, setAllListas] = useState<Lista[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  // Função para calcular o progresso do usuário baseado nas resoluções
  const getUserProgress = (listaId: number) => {
    const lista = allListas.find(l => l.id === listaId);
    
    // Se não há lista ou não há resoluções, retorna pendente
    if (!lista || !lista.resolucoes || lista.resolucoes.length === 0) {
      return { 
        status: 'pending' as const, 
        responses: 0, 
        progress: 0 
      };
    }

    // Encontra a última tentativa (maior tentativa_numero)
    const lastAttempt = lista.resolucoes.reduce((prev, current) => 
      (current.tentativa_numero > prev.tentativa_numero) ? current : prev
    );

    // Determina o status baseado no status da tentativa e no progresso
    let status: 'pending' | 'in-progress' | 'completed';
    const totalQuestions = lista.questoes_count || 0;
    const answeredQuestions = lastAttempt.respostas_count || 0;

    // Se todas as questões foram respondidas, considera completo
    if (answeredQuestions >= totalQuestions && totalQuestions > 0) {
      status = 'completed';
    } 
    // Se há respostas mas não completou todas, está em progresso
    else if (answeredQuestions > 0) {
      status = 'in-progress';
    }
    // Se não há respostas mas tem tentativa iniciada, também está em progresso
    else if (lastAttempt.status === 'iniciado') {
      status = 'in-progress';
    }
    // Caso contrário, pendente
    else {
      status = 'pending';
    }

    // Calcula o progresso percentual
    const progress = totalQuestions > 0 ? 
      Math.min(100, (answeredQuestions / totalQuestions) * 100) : 0;

    return {
      status,
      responses: answeredQuestions,
      progress: status === 'completed' ? 100 : progress
    };
  };

  useEffect(() => {
    const getDados = async () => {
      if (status === 'authenticated' && session?.laravelToken) {
        try {
          setIsLoading(true);
          setError(null);
          const token = session.laravelToken;

          const response = await getListOficial(token);

          let listasData: Lista[] = [];

          if (Array.isArray(response)) {
            listasData = response;
          } else if (response && Array.isArray(response.data)) {
            listasData = response.data;
          } else if (response && response.lista_info && Array.isArray(response.lista_info)) {
            listasData = response.lista_info;
          } else {
            listasData = [];
          }

          setAllListas(listasData);

        } catch (err) {
          console.error('Erro ao carregar listas:', err);
          setError("Falha ao carregar as listas.");
          setAllListas([]);
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

  const safeListas = Array.isArray(allListas) ? allListas : [];

  const filteredListas = safeListas.filter(lista => {
    const matchesSearch =
      lista.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lista.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lista.frentes?.some(frente => frente.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lista.assuntos?.some(assunto => assunto.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const userProgress = getUserProgress(lista.id);

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'pending') return matchesSearch && userProgress.status === 'pending';
    if (activeFilter === 'in-progress') return matchesSearch && userProgress.status === 'in-progress';
    if (activeFilter === 'completed') return matchesSearch && userProgress.status === 'completed';

    return matchesSearch;
  });

  if (isLoading || status === 'loading') {
    return (
      <ConteudoSkeleton />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#00091A] flex items-center justify-center p-8">
        <div className="text-center text-white">
          <div className="text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#E60076] hover:bg-[#c50064] rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExercisesHeader />
      <div className="bg-[#00091A] min-h-screen p-4 sm:p-8 md:p-16 text-white font-sans">
        <div className="max-w-7xl mx-auto">

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar listas..."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E60076] transition-shadow duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todos', icon: BookOpen },
                { key: 'pending', label: 'Pendente', icon: Clock },
                { key: 'in-progress', label: 'Em progresso', icon: PlayCircle },
                { key: 'completed', label: 'Finalizado', icon: CheckCircle }
              ].map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.key;

                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key as FilterType)}
                    className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#E60076] text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-[#E60076]/40'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nenhuma lista */}
          {filteredListas.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <BookOpen size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-lg mb-2">
                {searchTerm || activeFilter !== 'all'
                  ? 'Nenhuma lista encontrada para os filtros selecionados.'
                  : 'Nenhuma lista disponível no momento.'}
              </p>
              {(searchTerm || activeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  className="text-[#E60076] hover:text-[#ff4ea8] transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredListas.map((lista, index) => {
              const userProgress = getUserProgress(lista.id);

              const statusProps = {
                'completed': { text: 'Finalizado', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/20', icon: CheckCircle },
                'in-progress': { text: 'Em progresso', color: 'bg-blue-500', bgColor: 'bg-blue-500/20', icon: PlayCircle },
                'pending': { text: 'Pendente', color: 'bg-amber-500', bgColor: 'bg-amber-500/20', icon: Clock }
              }[userProgress.status];

              const StatusIcon = statusProps.icon;

              // Combinar todas as tags
              const allTags = [
                ...(lista.frentes || []).map(f => ({ ...f, type: 'frente' })),
                ...(lista.assuntos || []).map(a => ({ ...a, type: 'assunto' })),
                ...(lista.topicos || []).map(t => ({ ...t, type: 'topico' }))
              ];

              return (
                <Link key={lista.id} href={`listas-oficiais/${lista.id}`}>
                  <motion.div
                    className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden cursor-pointer flex flex-col hover:border-[#E60076] relative min-h-[340px]"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    whileHover={cardHover}
                  >

                    {/* Header do Card */}
                    <div className="p-4 pb-2 flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-[#E60076] rounded-lg flex items-center justify-center">
                          <BookOpen size={20} className="text-white" />
                        </div>

                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusProps.bgColor}`}>
                          <StatusIcon size={12} className={statusProps.color.replace('bg', 'text')} />
                          <span className={statusProps.color.replace('bg', 'text')}>
                            {statusProps.text}
                          </span>
                        </div>
                      </div>

                      {/* Título */}
                      <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight mb-2">
                        {lista.name}
                      </h3>

                      {/* Descrição */}
                      {lista.descricao && (
                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-3">
                          {lista.descricao}
                        </p>
                      )}

                      {/* Tags */}
                      {allTags.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-1 mb-2 text-gray-400">
                            <Tag size={12} />
                            <span className="text-xs font-medium">Tags:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {allTags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={`${tag.type}-${tag.nome}-${idx}`}
                                className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded-md truncate max-w-[100px]"
                                title={tag.nome}
                              >
                                {tag.nome}
                              </span>
                            ))}
                            {allTags.length > 3 && (
                              <span className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded-md">
                                +{allTags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 pt-2 border-t border-slate-700/50">
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <BookOpen size={14} />
                          <span>{lista.questoes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{lista.time || 0}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <CircularProgress
                          progress={userProgress.progress}
                          status={userProgress.status}
                        />
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {userProgress.responses}/{lista.questoes_count || 0}
                          </div>
                          <div className="text-xs text-gray-400">respostas</div>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}