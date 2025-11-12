// types/enem.ts (ou um novo arquivo types/api.ts)

export type Alternativa = {
  id: number;
  letra: string;
  texto: string;
};

export type Prova = {
  id: number;
  ano: number;
  banca: {
    id: number;
    nome: string;
  };
};

export type Topico = {
  id: number;
  nome: string;
};

// O tipo principal que o ModelQuestions vai receber
export type Questao = {
  id: number;
  enunciado: string;
  alternativa_correta_id: number;
  alternativas: Alternativa[];
  prova: Prova | null; // A prova pode ser nula
  topicos: Topico[];
};

// A resposta completa da API é um objeto de paginação
export type PaginatedQuestions = {
  current_page: number;
  data: Questao[];
  // ... outras propriedades de paginação
};