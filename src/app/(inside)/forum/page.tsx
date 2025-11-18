// forum/page.tsx
"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { 
  getForumThreads, 
  createForumThread,
  type ForumThread,
  type LaravelPaginationObject 
} from "@/lib/forum/forum";
import ForumSkeleton from "@/components/Skeletons/ForumSkeleton";

type FilterType = 'all' | 'pending' | 'closed' | 'mine';
type SortType = 'recent' | 'oldest';

const Forum = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  // Carregar threads
  const loadThreads = async (page: number = 1) => {
    if (!session?.laravelToken) {
      console.error('Token não encontrado');
      return;
    }
    
    setLoading(true);
    try {
      const data: LaravelPaginationObject<ForumThread> = await getForumThreads(session.laravelToken, page);
      setThreads(data.data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total
      });
    } catch (error) {
      console.error('Erro ao carregar threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      loadThreads();
    }
  }, [status, session]);

  const handleCreateThread = async (data: { title: string; body: string }) => {
    if (!session?.laravelToken) {
      console.error('Token não encontrado');
      return;
    }
    
    try {
      await createForumThread(session.laravelToken, data);
      setShowCreateModal(false);
      loadThreads();
    } catch (error) {
      console.error('Erro ao criar thread:', error);
    }
  };

  // Se não estiver autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#00091A] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-400 mb-6">Você precisa estar logado para acessar o fórum.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#0E00D0] hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  // Loading durante a autenticação
  if (status === 'loading' || loading) {
    return <ForumSkeleton />;
  }

  const filteredThreads = threads.filter(thread => {
    // Filtro por tipo
    if (filter === 'pending') return !thread.is_closed;
    if (filter === 'closed') return thread.is_closed;
    if (filter === 'mine') return thread.author.id.toString() === session?.user?.id;
    return true;
  }).filter(thread => {
    // Filtro por pesquisa
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      thread.title.toLowerCase().includes(searchLower) ||
      thread.body.toLowerCase().includes(searchLower) ||
      thread.author.name.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    // Ordenação
    if (sort === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
  });

  // Animação para os itens da lista
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  return (
  <div className="min-h-screen font-sans relative text-black bg-[#F6F6F6] dark:text-white dark:bg-[#00091A]">
    {/* Header */}
    <div className="px-8 py-6 border-gray-300 bg-white dark:bg-[#1B1F27] dark:border-gray-700">
      <h1 className="text-lg font-bold">
        Fórum{" "}
        <span className="font-normal text-gray-600 dark:text-gray-300">
          | Explore as dúvidas das questões disponíveis no nosso banco de questões.
        </span>
      </h1>
    </div>

    {/* Main Content */}
    <div className="container mx-auto px-4 lg:px-40 py-6">
      {/* Barra de pesquisa e ações */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar dúvidas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-10 pr-4 py-3 rounded-lg border 
              bg-white border-gray-300 text-black
              dark:bg-[#0F172A] dark:border-[#4A5260] dark:text-white 
              focus:outline-none focus:border-[#0E00D0] transition-colors
            "
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-[#4A5260]"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'closed', 'mine'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${
                    filter === filterType
                      ? 'bg-[#0E00D0] text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[#1B1F27] dark:text-gray-300 dark:hover:bg-[#2A2F3D]'
                  }
                `}
              >
                {filterType === 'all' && 'Todas'}
                {filterType === 'pending' && 'Pendentes'}
                {filterType === 'closed' && 'Finalizadas'}
                {filterType === 'mine' && 'Minhas'}
              </button>
            ))}
          </div>

          {/* Ordenação e Botão Nova Dúvida */}
          <div className="flex gap-3 items-center">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="
                text-sm px-3 py-2 rounded-lg cursor-pointer border 
                bg-white border-gray-300 text-black
                dark:bg-[#1B1F27] dark:text-white dark:border-[#4A5260] 
                focus:outline-none focus:border-[#0E00D0]
              "
            >
              <option className="text-black" value="recent">Mais recente</option>
              <option className="text-black" value="oldest">Mais antigo</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="
                bg-[#0E00D0] hover:bg-blue-700 px-4 py-2 rounded-lg 
                font-medium text-sm transition-all duration-200 
                hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25
              "
            >
              + Nova Dúvida
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Threads */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <AnimatePresence>
          {filteredThreads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-600 dark:text-gray-400"
            >
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Nenhuma dúvida encontrada</h3>
              <p>
                {filter === 'all' && search 
                  ? 'Tente ajustar os termos da pesquisa'
                  : filter !== 'all'
                  ? `Nenhuma dúvida ${filter === 'mine' ? 'sua' : filter === 'pending' ? 'pendente' : 'finalizada'}`
                  : 'Seja o primeiro a postar uma dúvida!'}
              </p>
            </motion.div>
          ) : (
            filteredThreads.map((thread) => (
              <motion.div
                key={thread.id}
                variants={itemVariants}
                layout
                onClick={() => router.push(`/forum/${thread.id}`)}
                className="
                  border rounded-lg p-6 cursor-pointer transition-all duration-300 group
                  border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400
                  dark:border-[#2F3541] dark:bg-[#0F172A] dark:hover:bg-[#151E2F]
                "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Conteúdo Principal */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-[#1B1F27] rounded-full flex items-center justify-center">
                          {thread.author.avatar ? (
                            <img
                              src={thread.author.avatar}
                              alt={thread.author.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                              {thread.author.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white group-hover:text-blue-500 transition-colors">
                            {thread.title}
                          </h3>

                          {/* Badges */}
                          <div className="flex gap-2">
                            {thread.is_closed && (
                              <span className="bg-green-600/15 text-green-700 dark:bg-green-500/20 dark:text-green-300 px-2 py-1 rounded text-xs border border-green-600/30">
                                Resolvida
                              </span>
                            )}
                            {thread.best_reply_id && (
                              <span className="bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 px-2 py-1 rounded text-xs border border-yellow-500/30">
                                Melhor resposta
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                          {thread.body}
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            👤 {thread.author.name}
                          </span>
                          <span>
                            {new Date(thread.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            💬 {thread.replies_count || 0} respostas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadados */}
                  {thread.linkable_type && (
                    <div className="rounded-lg px-4 py-3 min-w-[200px] bg-gray-200 dark:bg-[#1B1F27]">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {thread.linkable_type === 'Questao' ? 'Questão' : 'Aula'}
                      </div>
                      <div className="text-sm text-black dark:text-white font-medium">
                        ID: {thread.linkable_id}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Paginação */}
      {pagination.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => loadThreads(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
            className="
              px-4 py-2 rounded-lg 
              bg-gray-200 hover:bg-gray-300 text-black
              dark:bg-[#1B1F27] dark:hover:bg-[#2A2F3D] dark:text-white 
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Anterior
          </button>

          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Página {pagination.current_page} de {pagination.last_page}
          </span>

          <button
            onClick={() => loadThreads(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page}
            className="
              px-4 py-2 rounded-lg 
              bg-gray-200 hover:bg-gray-300 text-black
              dark:bg-[#1B1F27] dark:hover:bg-[#2A2F3D] dark:text-white 
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Próxima
          </button>
        </div>
      )}
    </div>

    {/* Modal Criar Nova Dúvida */}
    <CreateThreadModal
      isOpen={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      onSubmit={handleCreateThread}
    />
  </div>
);

};

// Componente Modal para Criar Thread (mantido igual)
const CreateThreadModal = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; body: string }) => void;
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit({ title, body });
      setTitle('');
      setBody('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-[#00091A] w-full max-w-2xl rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#2F3541]">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Nova Dúvida</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1B1F27] rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título da dúvida
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite um título claro para sua dúvida..."
                  className="w-full px-4 py-3 rounded-lg border border-[#4A5260] bg-[#0F172A] focus:outline-none focus:border-[#0E00D0] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição detalhada
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Descreva sua dúvida em detalhes. Se for sobre uma questão específica, mencione o ID..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-[#4A5260] bg-[#0F172A] focus:outline-none focus:border-[#0E00D0] transition-colors resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg border border-[#4A5260] text-gray-300 hover:bg-[#1B1F27] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !body.trim()}
                  className="px-6 py-3 rounded-lg bg-[#0E00D0] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {loading ? 'Publicando...' : 'Publicar Dúvida'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Forum;