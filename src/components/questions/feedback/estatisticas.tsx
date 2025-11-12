// components/questions/feedback/estatisticas.tsx
"use client";

import { motion } from "framer-motion";
import { BarChart3, Users, Target, Clock } from "lucide-react";

interface EstatisticasQuestaoProps {
    questaoId?: number;
    dificuldade?: number;
}

export const EstatisticasQuestao: React.FC<EstatisticasQuestaoProps> = ({ 
    questaoId,
    dificuldade = 3
}) => {
    // Dados mockados - você substituiria por dados reais da sua API
    const estatisticas = {
        totalRespostas: 1247,
        acertos: 843,
        erros: 404,
        taxaAcerto: 67.6,
        tempoMedio: "2:15",
        dificuldade: dificuldade,
        rankingDificuldade: "Médio" as const
    };

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
                            <div className="text-2xl font-bold text-white">{estatisticas.totalRespostas}</div>
                            <div className="text-gray-400 text-sm">Total de respostas</div>
                        </div>

                        {/* Taxa de Acerto */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <Target className="mx-auto text-green-400 mb-2" size={24} />
                            <div className="text-2xl font-bold text-white">{estatisticas.taxaAcerto}%</div>
                            <div className="text-gray-400 text-sm">Taxa de acerto</div>
                        </div>

                        {/* Tempo Médio */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <Clock className="mx-auto text-yellow-400 mb-2" size={24} />
                            <div className="text-2xl font-bold text-white">{estatisticas.tempoMedio}</div>
                            <div className="text-gray-400 text-sm">Tempo médio</div>
                        </div>

                        {/* Dificuldade */}
                        <div className="bg-[#131b2d] rounded-lg p-4 text-center border border-gray-700">
                            <BarChart3 className={`mx-auto mb-2 ${getDificuldadeColor(estatisticas.dificuldade)}`} size={24} />
                            <div className={`text-2xl font-bold ${getDificuldadeColor(estatisticas.dificuldade)}`}>
                                {getDificuldadeTexto(estatisticas.dificuldade)}
                            </div>
                            <div className="text-gray-400 text-sm">Dificuldade</div>
                        </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                            <span>Distribuição de Acertos</span>
                            <span>{estatisticas.acertos} acertos / {estatisticas.erros} erros</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <div 
                                className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${estatisticas.taxaAcerto}%` }}
                            />
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700">
                        <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                            <span>📊</span>
                            Insights desta questão
                        </h4>
                        <ul className="text-blue-200 text-sm space-y-1">
                            <li>• {estatisticas.taxaAcerto}% dos estudantes acertaram</li>
                            <li>• Dificuldade considerada {estatisticas.rankingDificuldade.toLowerCase()}</li>
                            <li>• Tempo médio de resolução: {estatisticas.tempoMedio}</li>
                            {estatisticas.taxaAcerto > 70 && (
                                <li>• 🎯 Questão com boa taxa de acerto</li>
                            )}
                            {estatisticas.taxaAcerto < 40 && (
                                <li>• ⚠️ Questão considerada desafiadora</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};