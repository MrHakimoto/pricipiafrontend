// components/questions/feedback/gabarito.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GabaritoQuestaoProps {
    questaoId?: number;
    gabaritoVideo?: string;
    gabaritoComentado?: string;
}

export const GabaritoQuestao: React.FC<GabaritoQuestaoProps> = ({ 
    questaoId,
    gabaritoVideo = "https://www.youtube.com/embed/B7xai5u_tnk?si=ad9OOCeCoZokOX1o",
    gabaritoComentado = "Este é o comentário detalhado do gabarito explicando por que a alternativa correta é de fato a correta e por que as outras estão incorretas."
}) => {
    const [activeTab, setActiveTab] = useState<'video' | 'texto'>('video');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex justify-center my-6"
        >
            <div className="bg-[#0e1525] rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-800 overflow-hidden">

                {/* Aba superior */}
                <div className="flex border-b border-gray-700 text-sm font-medium">
                    <button 
                        onClick={() => setActiveTab('video')}
                        className={`cursor-pointer px-6 py-3 transition-colors flex items-center gap-2 ${
                            activeTab === 'video' 
                                ? 'text-white bg-[#131b2d] border-b-2 border-pink-500' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span></span>
                        Vídeo
                    </button>
                    <button 
                        onClick={() => setActiveTab('texto')}
                        className={`cursor-pointer px-6 py-3 transition-colors flex items-center gap-2 ${
                            activeTab === 'texto' 
                                ? 'text-white bg-[#131b2d] border-b-2 border-pink-500' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <span></span>
                        Texto
                    </button>
                </div>

                {/* Conteúdo das Abas */}
                <AnimatePresence mode="wait">
                    {activeTab === 'video' && (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Cabeçalho do autor */}
                            

                            {/* Vídeo */}
                            <div className="aspect-video relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={gabaritoVideo}
                                    title={`Gabarito Questão ${questaoId}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'texto' && (
                        <motion.div
                            key="texto"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="p-6"
                        >
                            <div className="bg-[#131b2d] rounded-lg p-6 border border-gray-700">
                                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                                    Explicação Detalhada
                                </h3>
                                <div className="text-gray-300 leading-relaxed text-justify">
                                    {gabaritoComentado}
                                </div>
                                
                                {/* Dica extra */}
                                <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                                    <div className="flex items-center gap-2 text-blue-300 font-semibold mb-2">
                                                       Dica Importante
                                    </div>
                                    <p className="text-blue-200 text-sm">
                                       Lembre-se, antes falhar do que ser um fracassado!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};