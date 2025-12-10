// components/questions/QuestionSkeleton.tsx
import React from 'react';

export const QuestionSkeleton: React.FC = () => {
    return (
        <div className="bg-[#00091A] rounded-lg shadow-xl mb-8 border border-[#616161] animate-pulse">
            {/* Cabeçalho da Questão */}
            <div className="w-full bg-blue-950 border-b border-gray-700">
                <div className="flex items-center bg-gray-800 overflow-hidden w-full">
                    <div className="bg-gradient-to-br from-[#1F293C] to-[#2D3748] px-6 py-4 flex items-center gap-4 flex-shrink-0">
                        <div className="flex flex-col items-center">
                            <div className="h-2 w-12 bg-gray-600 rounded mb-1"></div>
                            <div className="h-6 w-6 bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div className="flex flex-col items-center">
                            <div className="h-2 w-8 bg-gray-600 rounded mb-1"></div>
                            <div className="h-5 w-5 bg-blue-400/50 rounded"></div>
                        </div>
                    </div>

                    <div className="flex-grow rounded-l-md bg-white px-6 py-3">
                        <div className="h-4 w-32 bg-gray-300 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Metadados */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white">
                <div className="flex flex-wrap gap-3">
                    <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
                    <div className="h-6 w-12 bg-gray-700 rounded-full"></div>
                </div>
                <div className="h-6 w-6 bg-gray-700 rounded"></div>
            </div>

            {/* Corpo da Questão */}
            <section className="p-6">
                {/* Enunciado Skeleton */}
                <div className="space-y-3 mb-6">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-700 rounded w-4/5"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                </div>

                {/* Alternativas Skeleton */}
                <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((letra) => (
                        <div key={letra} className="flex items-center p-3 rounded-lg bg-gray-800">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-600 mr-3 bg-gray-700 flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-700 rounded w-full"></div>
                                <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botão Responder Skeleton */}
                <div className="mt-8 ml-4">
                    <div className="h-10 w-32 bg-gray-700 rounded-lg"></div>
                </div>
            </section>

            {/* Rodapé */}
            <div className="w-full bg-gray-800 rounded-b-lg">
                <div className="w-full flex flex-col sm:flex-row justify-around items-center py-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2 p-2 w-full sm:w-1/3 justify-center">
                            <div className="h-6 w-6 bg-gray-700 rounded"></div>
                            <div className="h-4 w-24 bg-gray-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Componente para múltiplos skeletons
export const MultipleQuestionSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="space-y-8">
                {Array.from({ length: count }).map((_, index) => (
                    <QuestionSkeleton key={index} />
                ))}
            </div>
        </div>
    );
};