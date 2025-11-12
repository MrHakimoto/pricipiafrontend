export type Alternativa = {
  id: number;
  questao_id: number;
  texto: string;
  ordem: number;
  letra: string;
  created_at: string;
  updated_at: string;
};

export type Prova = {
  id: number;
  nome: string;
  sigla: string;
  ano: number;
  banca_id: number;
  observacoes: string | null;
  foto_url: string | null;
  elegivel: boolean;
  created_at: string;
  updated_at: string;
} | null; // Adicionei null aqui

export type Questao = {
  id: number;
  prova_id: number;
  alternativa_correta_id: number;
  enunciado: string;
  gabarito_comentado_texto: string;
  gabarito_video: string;
  minutagem: number | null;
  dificuldade: number;
  created_at: string;
  updated_at: string;
  pivot: {
    lista_id: number;
    questao_id: number;
    created_at: string;
    updated_at: string;
  };
  alternativas: Alternativa[];
  prova: Prova; // Agora pode ser null
};

// Tipo para a lista completa
export type ListaCompleta = {
  id: number;
  nome: string;
  descricao?: string;
  total_time_in_seconds?: number;
};
