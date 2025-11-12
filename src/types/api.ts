// types/api.ts
export interface Alternativa {
  id: number;
  letra: string;
  texto: string;
}

export interface Topico {
  id: number;
  nome: string;
}

export interface Banca {
  nome: string;
}

export interface Prova {
  banca?: Banca;
  ano: number;
}

export interface Questao {
  id: number;
  enunciado: string;
  alternativa_correta_id: number;
  alternativas: Alternativa[];
  topicos?: Topico[];
  prova?: Prova;
}