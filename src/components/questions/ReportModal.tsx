// components/questions/ReportModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { inviteReport } from "@/lib/questions/report";

const motivos = [
    "Enunciado/alternativa errada",
    "Gabarito errado",
    "Disciplina ou assunto errado",
    "Questão anulada",
    "Questão desatualizada",
    "Questão duplicada",
];

interface ReportarModalProps {
    questaoId: number;
    onClose: () => void;
    token: string; // Adicione o token como prop
}

export default function ReportarModal({ questaoId, onClose, token }: ReportarModalProps) {
    const [motivo, setMotivo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    // Bloquear scroll quando modal estiver aberto
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // Fechar modal com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting && !showSuccess) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose, isSubmitting, showSuccess]);

    const submit = async () => {
        if (!motivo || !descricao) return;

        setIsSubmitting(true);
        setError("");

        try {
            // Preparar os dados para o reporte
            const reportData = {
                title: motivo, // Usa o motivo como título
                message: `Questão #${questaoId}: ${descricao}`, // Inclui o ID da questão na mensagem
                type: "questao_error" // Tipo fixo conforme especificado
            };

            // Enviar o reporte usando a função inviteReport
            await inviteReport(reportData, token);

            console.log("REPORTE ENVIADO COM SUCESSO:", { questaoId, motivo, descricao });

            setIsSubmitting(false);
            setShowSuccess(true);

            // Fechar automaticamente após 2 segundos
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error("ERRO AO ENVIAR REPORTE:", err);
            setError(err.message || "Erro ao enviar reporte. Tente novamente.");
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isSubmitting && !showSuccess) {
            onClose();
        }
    };

    if (!questaoId) return null;

    return (
        <>
            {/* Modal Principal */}
            <AnimatePresence>
                {!showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleOverlayClick}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl w-full max-w-2xl border border-gray-600/50 shadow-2xl relative"
                        >
                            {/* Botão Fechar */}
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Reportar Problema
                                </h2>
                                <p className="text-gray-300 text-lg">
                                    Questão #{questaoId}
                                </p>
                            </div>

                            {/* Mensagem de Erro */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center"
                                >
                                    <AlertCircle className="w-5 h-5 inline mr-2" />
                                    {error}
                                </motion.div>
                            )}

                            {/* Motivos */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                    <h3 className="text-white text-xl font-semibold">
                                        Selecione o motivo:
                                    </h3>
                                </div>
                                <div className="grid gap-3 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
                                    {motivos.map((m, index) => (
                                        <label
                                            key={m}
                                            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${motivo === m
                                                    ? 'border-[#C6005C] bg-[#C6005C]/10'
                                                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="motivo"
                                                value={m}
                                                checked={motivo === m}
                                                onChange={() => setMotivo(m)}
                                                className="sr-only"
                                            />
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${motivo === m
                                                    ? 'border-[#C6005C] bg-[#C6005C]'
                                                    : 'border-gray-500'
                                                }`}>
                                                {motivo === m && (
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                )}
                                            </div>
                                            <span className="text-gray-200 text-lg font-medium flex-1">
                                                {m}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Textarea */}
                            <AnimatePresence>
                                {motivo && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-6"
                                    >
                                        <label className="block text-white text-xl font-semibold mb-4">
                                            Descreva o problema em detalhes:
                                        </label>
                                        <textarea
                                            className="w-full p-4 rounded-xl bg-gray-800/80 border-2 border-gray-600 text-gray-100 text-lg placeholder-gray-400 focus:border-[#C6005C] focus:outline-none transition-colors duration-200 resize-none"
                                            rows={5}
                                            placeholder="Por favor, forneça o máximo de detalhes possível para nos ajudar a entender e corrigir o problema..."
                                            value={descricao}
                                            onChange={(e) => setDescricao(e.target.value)}
                                            disabled={isSubmitting}
                                            maxLength={500}
                                        />
                                        <p className="text-gray-400 text-sm mt-2">
                                            {descricao.length}/500 caracteres
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Botão Enviar */}
                            <motion.button
                                onClick={submit}
                                disabled={!motivo || !descricao || isSubmitting}
                                whileHover={{ scale: !motivo || !descricao || isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: !motivo || !descricao || isSubmitting ? 1 : 0.98 }}
                                className={`w-full py-4 rounded-xl font-bold text-xl transition-all duration-200 ${!motivo || !descricao || isSubmitting
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#C6005C] hover:bg-[#D10063] text-white shadow-lg shadow-[#C6005C]/25'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                                        Enviando...
                                    </div>
                                ) : (
                                    'Enviar Reporte'
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Popup de Agradecimento */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="bg-gradient-to-br from-gray-900 to-gray-800 p-12 rounded-2xl border border-gray-600/50 shadow-2xl text-center max-w-md mx-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </motion.div>

                            <h3 className="text-2xl font-bold text-white mb-4">
                                Obrigado!
                            </h3>

                            <p className="text-gray-300 text-lg mb-2">
                                Seu reporte foi enviado com sucesso.
                            </p>

                            <p className="text-gray-400 text-base">
                                Nossa equipe irá analisar o problema.
                            </p>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.5, duration: 2 }}
                                className="h-1 bg-green-500 rounded-full mt-6"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
        </>
    );
}