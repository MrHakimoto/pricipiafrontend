"use client";

import { useEffect, useState } from 'react';

// ... (listas de frases e função getRandomPhrase continuam iguais)
const frasesDeAcerto = ["Excelente!", "Mandou bem!", "É isso aí!", "Perfeito!", "Continue assim!"];
const frasesDeErro = ["Quase lá!", "Não desanime!", "O erro faz parte do aprendizado.", "Continue estudando!"];
const getRandomPhrase = (status: 'correct' | 'incorrect') => {
    const list = status === 'correct' ? frasesDeAcerto : frasesDeErro;
    return list[Math.floor(Math.random() * list.length)];
};

type Props = {
    status: 'correct' | 'incorrect';
    onAnimationEnd: () => void; // Nova prop para avisar quando a animação deve sumir
};

export const AnswerFeedbackOverlay = ({ status, onAnimationEnd }: Props) => {
    const [phrase, setPhrase] = useState("");

    useEffect(() => {
        setPhrase(getRandomPhrase(status));
        
        // Define um timer para 'avisar' o componente pai para sumir após 2 segundos
        const timer = setTimeout(() => {
            onAnimationEnd();
        }, 2000); // 2000ms = 2 segundos

        // Limpa o timer se o componente for desmontado antes
        return () => clearTimeout(timer);
    }, [status, onAnimationEnd]);

    const isCorrect = status === 'correct';
    const strokeColor = isCorrect ? "#22c55e" : "#ef4444";

    return (
        // A MUDANÇA É AQUI: Fundo mais sutil e sem blur
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/60 animate-fade-in">
            <svg
                width="160" // Tamanho aumentado
                height="160" // Tamanho aumentado
                viewBox="0 0 52 52"
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle
                    cx="26" cy="26" r="25"
                    strokeDasharray="157" strokeDashoffset="157"
                    style={{ animation: "dash 0.8s ease-out forwards" }}
                />
                {isCorrect ? (
                    <path
                        d="M14 27 L22 35 L38 19"
                        strokeDasharray="50" strokeDashoffset="50"
                        style={{ animation: "dash 0.6s 0.8s ease-out forwards" }}
                    />
                ) : (
                    <>
                        <path d="M16 16 L36 36" strokeDasharray="40" strokeDashoffset="40" style={{ animation: "dash 0.6s 0.8s ease-out forwards" }} />
                        <path d="M36 16 L16 36" strokeDasharray="40" strokeDashoffset="40" style={{ animation: "dash 0.6s 0.8s ease-out forwards" }} />
                    </>
                )}
            </svg>
            
            <p className="mt-4 text-white text-3xl font-bold animate-fade-in-up">
                {phrase}
            </p>

            <style jsx global>{`
                @keyframes dash { to { stroke-dashoffset: 0; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.5s 1.0s ease-out forwards; opacity: 0; }
            `}</style>
        </div>
    );
};