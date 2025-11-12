// components/questions/feedback/duvida.tsx
"use client";

import MarkdownEditor from "@/components/editor/MarkDownEditor";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";

interface DuvidaQuestaoProps {
    questaoId?: number;
    enunciado?: string;
    onDuvidaChange?: (duvida: string) => void; // Nova prop
}

export const DuvidaQuestao: React.FC<DuvidaQuestaoProps> = ({ 
    questaoId,
    enunciado = "Este é o enunciado da questão...",
    onDuvidaChange // Recebe a prop
}) => {
    const [mensagem, setMensagem] = useState("");

    // Função para lidar com mudanças no editor
    const handleMensagemChange = (novaMensagem: string) => {
        setMensagem(novaMensagem);
        if (onDuvidaChange) {
            onDuvidaChange(novaMensagem); // Chama a prop onChange
        }
    };

    const handleEnviarDuvida = () => {
        if (mensagem.trim()) {
            console.log("Dúvida enviada:", { questaoId, mensagem });
            // Aqui você integraria com sua API
            setMensagem("");
            if (onDuvidaChange) {
                onDuvidaChange(""); // Limpa também no parent se necessário
            }
            alert("Dúvida enviada com sucesso! Nossa equipe responderá em breve.");
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
                    <MessageCircle className="text-blue-500" size={24} />
                    <div className="flex flex-col">
                        <h3 className="text-white font-semibold text-lg">Tire sua Dúvida</h3>
                        <p className="text-gray-400 text-sm">Nossa equipe de especialistas vai te ajudar</p>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                    {/* Preview da Questão */}
                    <div className="bg-[#131b2d] rounded-lg p-4 mb-4 border border-gray-700">
                        <h4 className="text-white font-medium mb-2">Questão #{questaoId}</h4>
                        <p className="text-gray-300 text-sm line-clamp-3">
                            {enunciado.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                    </div>

                    {/* Formulário de Dúvida */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Sua Dúvida *
                            </label>

                            <MarkdownEditor 
                                editorStyle={{ height: "180px" }} 
                                initialContent={mensagem}  
                                onChange={handleMensagemChange} // Usa a função local
                            />
                        </div>

                        {/* Dicas */}
                        <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-700">
                            <div className="flex items-center gap-2 text-yellow-300 text-sm font-medium mb-1">
                                <span>💡</span>
                                Dicas para uma boa pergunta:
                            </div>
                            <ul className="text-yellow-200 text-xs space-y-1">
                                <li>• Seja específico sobre o que não entendeu</li>
                                <li>• Mencione o passo onde tem dificuldade</li>
                                <li>• Compartilhe seu raciocínio atual</li>
                            </ul>
                        </div>

                        {/* Botão Enviar */}
                        <button
                            onClick={handleEnviarDuvida}
                            disabled={!mensagem.trim()}
                            className="cursor-pointer w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            Enviar Dúvida
                        </button>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="mt-4 text-center text-gray-400 text-xs">
                        <p>⌛ Resposta em até 24 horas</p>
                        <p>Resposta por especialistas da matéria</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};