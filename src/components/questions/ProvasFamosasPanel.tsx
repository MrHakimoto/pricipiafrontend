// components/questions/ProvasFamosasPanel.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, spring, AnimatePresence, type Variants } from 'framer-motion';
import { gerarSimuladoDaProva, getAvailableExams, getEditionsByExam, ProvaGroup, ProvaEdition } from '@/lib/questions/provasFamosas';
import { useSession } from 'next-auth/react';

// Ícones
const XIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
);

// Variantes de animação
const dropIn: Variants = {
    hidden: { y: -500, opacity: 0, scale: 0.8 },

    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            type: "spring",
            damping: 25,
            stiffness: 300,
        }
    },

    exit: {
        y: 500,
        opacity: 0,
        scale: 0.8,
        transition: {
            duration: 0.2,
            type: "spring"
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};


interface SimuladoConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    provaSelecionada: ProvaGroup | null;
    edicoes: ProvaEdition[];
}

// --- Componente do Modal ---
const SimuladoConfigModal = ({
    isOpen,
    onClose,
    provaSelecionada,
    edicoes
}: SimuladoConfigModalProps) => {
    const timeOptions = [
        { value: '', label: 'Selecione a quantidade' },
        { value: '90', label: '90 minutos (1h 30min)' },
        { value: '120', label: '120 minutos (2h 00min)' },
        { value: '135', label: '135 minutos (2h 15min - Sugerido)' },
        { value: '180', label: '180 minutos (3h 00min)' },
        { value: '240', label: '240 minutos (4h 00min)' },
    ];


    const { data: session, status } = useSession();
    const token = session?.laravelToken!;
    const suggestedTimeText = '02:15:00';
    const defaultTime = '';

    // Estado da configuração
    const [selectedEdition, setSelectedEdition] = useState('');
    const [selectedTime, setSelectedTime] = useState(defaultTime);
    const [isLoading, setIsLoading] = useState(false);

    // Resetar seleções quando o modal abrir
    useEffect(() => {
        if (isOpen) {
            setSelectedEdition('');
            setSelectedTime(defaultTime);
        }
    }, [isOpen]);

    const handleStartSimulado = async () => {
        if (isLoading || !selectedEdition || !selectedTime) return;

        setIsLoading(true);
        try {
            // Aqui você pegaria o token do usuário (ex: do contexto de auth)

            const resultado = await gerarSimuladoDaProva(token, selectedEdition);
            console.log('Simulado criado:', resultado);
            // Redirecionar para a página do simulado ou mostrar sucesso
            onClose();
        } catch (error) {
            console.error('Erro ao criar simulado:', error);
            // Mostrar mensagem de erro para o usuário
        } finally {
            setIsLoading(false);
        }
    };

    const isConfigValid = selectedEdition !== '' && selectedTime !== '';

    if (!isOpen) return null;

    const modalBg = 'bg-[#121620]';
    const inputBg = 'bg-[#191D28]';
    const inputBorder = 'border-[#434A56]';
    const pinkButton = 'bg-[#EC0058]';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <motion.div
                onClick={(e) => e.stopPropagation()}
                variants={dropIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`w-full max-w-md mx-auto ${modalBg} text-gray-100 rounded-lg shadow-2xl border border-slate-700/80`}
            >
                {/* Cabeçalho do Modal */}
                <div className="relative p-6 pb-2 border-b border-slate-700/50">
                    <h2 className="text-xl font-normal text-gray-100">
                        {provaSelecionada?.nome || 'Questões'}
                    </h2>
                    <p className="text-sm font-light text-gray-400 mt-1">
                        Escolha a edição e o tempo de resolução
                    </p>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white transition duration-150 absolute top-2 right-2">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Corpo do Modal */}
                <div className="p-6 space-y-6">

                    {/* 1. Escolha da Edição */}
                    <div>
                        <label className="block text-lg font-normal text-gray-100 mb-2">
                            Qual edição
                        </label>
                        <select
                            value={selectedEdition}
                            onChange={(e) => setSelectedEdition(e.target.value)}
                            className={`w-full px-4 py-3 ${inputBg} text-gray-300 ${inputBorder} border rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-base h-12`}
                        >
                            <option value="" disabled>Selecione a edição</option>
                            {edicoes.map((edicao) => (
                                <option
                                    key={edicao.id}
                                    value={edicao.id}
                                    className="bg-slate-900 text-gray-300"
                                >
                                    {edicao.ano} {edicao.descricao ? `- ${edicao.descricao}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Tempo para a Resolução */}
                    <div>
                        <label className="block text-lg font-normal text-gray-100 mb-2">
                            Tempo para a resolução
                        </label>
                        <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className={`w-full px-4 py-3 ${inputBg} text-gray-300 ${inputBorder} border rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-base h-12`}
                        >
                            {timeOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.value === ''}
                                    className="bg-slate-900 text-gray-300"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Tempo Sugerido e Aviso */}
                    <div className="pt-2">
                        <p className="text-sm font-light text-gray-300">
                            Tempo sugerido: <span className="font-bold text-indigo-400">{suggestedTimeText}</span>
                        </p>
                        <p className="mt-4 text-sm font-normal text-yellow-500">
                            *Você irá resolver um simulado, diante disso, se prepare semelhante ao dia da prova
                        </p>
                    </div>

                    {/* 4. Botão de Ação */}
                    <div className='pt-6'>
                        <motion.button
                            onClick={handleStartSimulado}
                            disabled={!isConfigValid || isLoading}
                            className={`
                w-full py-3 font-normal text-lg rounded-md transition-all duration-200 ease-in-out flex items-center justify-center h-12
                ${isConfigValid && !isLoading
                                    ? `${pinkButton} hover:bg-[#C2185B] text-white shadow-lg shadow-[#E91E63]/30`
                                    : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                                }
              `}
                        >
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.span
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center"
                                    >
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Preparando prova...
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="text"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        Ir para prova
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- Componente Principal ---
const ProvasFamosasPanel = () => {
    const [provas, setProvas] = useState<ProvaGroup[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [provaSelecionada, setProvaSelecionada] = useState<ProvaGroup | null>(null);
    const [edicoes, setEdicoes] = useState<ProvaEdition[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingEdicoes, setLoadingEdicoes] = useState(false);
    const { data: session, status } = useSession();
    const token = session?.laravelToken!;

    // Carregar provas disponíveis
    useEffect(() => {
        const carregarProvas = async () => {
            try {
                // Aqui você pegaria o token do usuário

                const provasDisponiveis = await getAvailableExams(token);
                setProvas(provasDisponiveis);
            } catch (error) {
                console.error('Erro ao carregar provas:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarProvas();
    }, []);

    // Função para lidar com o clique em uma prova
    const handleProvaClick = async (prova: ProvaGroup) => {
        setProvaSelecionada(prova);
        setLoadingEdicoes(true);

        try {

            const edicoesDaProva = await getEditionsByExam(token, prova.nome);
            setEdicoes(edicoesDaProva);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Erro ao carregar edições:', error);
        } finally {
            setLoadingEdicoes(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white text-lg">Carregando provas...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-extrabold text-white mb-2 text-center">
                    Provas Famosas
                </h1>
                <p className="text-gray-400 mb-8 text-center">
                    Selecione uma prova para ver as edições disponíveis
                </p>

                {/* Grid de Provas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {provas.map((prova, index) => (
                        <motion.div
                            key={prova.id || prova.nome}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-slate-800 rounded-xl p-6 cursor-pointer border border-slate-700 hover:border-indigo-500 transition-all duration-300 group"
                            onClick={() => handleProvaClick(prova)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                                        <BookIcon className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                        {prova.nome}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex items-center text-gray-400 mb-2">
                                <ClockIcon className="w-4 h-4 mr-2" />
                                <span className="text-sm">
                                    {prova.total_edicoes} edição{prova.total_edicoes !== 1 ? 'es' : ''} disponível{prova.total_edicoes !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <p className="text-gray-500 text-sm mt-4 group-hover:text-gray-400 transition-colors">
                                Clique para ver todas as edições e iniciar um simulado
                            </p>
                        </motion.div>
                    ))}
                </div>

                {provas.length === 0 && !loading && (
                    <div className="text-center text-gray-400 py-12">
                        Nenhuma prova disponível no momento.
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <SimuladoConfigModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        provaSelecionada={provaSelecionada}
                        edicoes={edicoes}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProvasFamosasPanel;