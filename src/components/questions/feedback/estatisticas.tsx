// components/questions/feedback/estatisticas.tsx
"use client";

import { motion } from "framer-motion";
import { BarChart3, Users, Target, Clock, AlertCircle, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { getQuestaoStats, QuestaoStats } from "@/lib/questions/estatisticas";

interface EstatisticasQuestaoProps {
    questaoId: number;
    dificuldade?: number;
    token?: string;
}

export const EstatisticasQuestao: React.FC<EstatisticasQuestaoProps> = ({ 
    questaoId,
    dificuldade = 3,
    token
}) => {
    const [estatisticas, setEstatisticas] = useState<QuestaoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const carregarEstatisticas = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!token) return; // garante que não chama errado
                const data = await getQuestaoStats(token, questaoId);
                setEstatisticas(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas");
            } finally {
                setLoading(false);
            }
        };

        if (questaoId && token) {
            carregarEstatisticas();
        }
    }, [questaoId, token]);

    const getDificuldadeColor = (nivel: number) => {
        switch(nivel) {
            case 1: return 'text-green-400';
            case 2: return 'text-yellow-400';
            case 3: return 'text-orange-400';
            case 4: return 'text-red-400';
            case 5: return 'text-purple-400';
            default: return 'text-gray-400';
        }
    };

    const getDificuldadeTexto = (nivel: number) => {
        switch(nivel) {
            case 1: return 'Muito Fácil';
            case 2: return 'Fácil';
            case 3: return 'Médio';
            case 4: return 'Difícil';
            case 5: return 'Muito Difícil';
            default: return 'Não avaliada';
        }
    };

    // Loading state
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center my-6"
            >
                <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 p-8">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="text-purple-500 animate-spin" size={24} />
                        <span className="text-white text-lg">Carregando estatísticas...</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Error state
    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center my-6"
            >
                <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-red-800/50 p-6">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertCircle size={24} />
                        <div>
                            <h3 className="font-semibold">Erro ao carregar estatísticas</h3>
                            <p className="text-red-300 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Se não há estatísticas
    if (!estatisticas) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center my-6"
            >
                <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 p-6">
                    <div className="text-center text-gray-400">
                        <BarChart3 className="mx-auto mb-2" size={32} />
                        <p>Nenhuma estatística disponível para esta questão</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    const taxaAcerto = estatisticas.taxa_acerto;
    const totalRespostas = estatisticas.total_respostas;
    const acertos = estatisticas.distribuicao.acertos;
    const erros = estatisticas.distribuicao.erros;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center my-6"
        >
            <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 overflow-hidden">

                {/* Cabeçalho */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
                    <BarChart3 className="text-purple-500" size={24} />
                    <div className="flex flex-col">
                        <h3 className="text-white font-semibold text-lg">Estatísticas da Questão</h3>
                        <p className="text-gray-400 text-sm">Desempenho geral dos estudantes</p>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                    {/* Grid de Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {/* Total de Respostas */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <Users className="mx-auto text-blue-400 mb-2" size={24} />
                            <div className="text-2xl font-bold text-white">{totalRespostas.toLocaleString()}</div>
                            <div className="text-gray-400 text-sm">Total de respostas</div>
                        </div>

                        {/* Taxa de Acerto */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <Target className="mx-auto text-green-400 mb-2" size={24} />
                            <div className="text-2xl font-bold text-white">{taxaAcerto.toFixed(1)}%</div>
                            <div className="text-gray-400 text-sm">Taxa de acerto</div>
                        </div>

                        {/* Tempo Médio */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <Clock className="mx-auto text-yellow-400 mb-2" size={24} />
                            <div className="text-2xl font-bold text-white">--:--</div>
                            <div className="text-gray-400 text-sm">Tempo médio</div>
                        </div>

                        {/* Dificuldade */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <BarChart3 className={`mx-auto mb-2 ${getDificuldadeColor(dificuldade)}`} size={24} />
                            <div className={`text-2xl font-bold ${getDificuldadeColor(dificuldade)}`}>
                                {getDificuldadeTexto(dificuldade)}
                            </div>
                            <div className="text-gray-400 text-sm">Dificuldade</div>
                        </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                            <span>Distribuição de Acertos</span>
                            <span>{acertos} acertos / {erros} erros</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <div 
                                className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${taxaAcerto}%` }}
                            />
                        </div>
                    </div>

                    {/* Estatísticas das Alternativas */}
                    {estatisticas.alternativas_stats.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-white font-medium mb-3">Desempenho por Alternativa</h4>
                            <div className="space-y-2">
                                {estatisticas.alternativas_stats.map((alternativa, index) => (
                                    <div key={alternativa.id} className="flex items-center justify-between p-3 bg-[#131b2d] rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                alternativa.is_correta 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-gray-600 text-gray-300'
                                            }`}>
                                                {alternativa.letra}
                                            </div>
                                            <span className="text-white">{alternativa.texto}</span>
                                            {alternativa.is_correta && (
                                                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                                                    Correta
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-medium">{alternativa.porcentagem}</div>
                                            <div className="text-gray-400 text-sm">
                                                {alternativa.total_votos} votos
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700">
                        <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                            <span>📊</span>
                            Insights desta questão
                        </h4>
                        <ul className="text-blue-200 text-sm space-y-1">
                            <li>• {taxaAcerto.toFixed(1)}% dos estudantes acertaram</li>
                            <li>• Dificuldade considerada {getDificuldadeTexto(dificuldade).toLowerCase()}</li>
                            <li>• {totalRespostas.toLocaleString()} respostas coletadas</li>
                            {taxaAcerto > 70 && (
                                <li>• 🎯 Questão com boa taxa de acerto</li>
                            )}
                            {taxaAcerto < 40 && (
                                <li>• ⚠️ Questão considerada desafiadora</li>
                            )}
                            {taxaAcerto >= 40 && taxaAcerto <= 70 && (
                                <li>• ⚖️ Questão com dificuldade equilibrada</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};