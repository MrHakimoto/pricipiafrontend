// types/questions.ts
export type QuestaoBase = {
  id: number;
  enunciado: string;
  dificuldade: number;
  alternativa_correta_id: number;
  alternativas: { id: number; letra: string; texto: string }[];
  topicos: { id: number; nome: string }[];
  prova: { 
    banca: { nome: string }; 
    ano: number;
    sigla?: string; // ✅ adicionado
  };
  gabarito_video: string | null;
  gabarito_comentado_texto: string;
  adaptado: boolean;
};
