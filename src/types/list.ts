// types/list.ts
export type Alternativa = {
  id: number;
  questao_id: number;
  texto: string;
  ordem: number;
  letra: string;
  created_at: string;
  updated_at: string;
};

export type Topico = {
  id: number;
  nome: string;
  assunto_id?: number;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    questao_id: number;
    topico_id: number;
  };
  assunto?: {
    id: number;
    nome: string;
    frente_id?: number;
    created_at?: string;
    updated_at?: string;
    frente?: {
      id: number;
      nome: string;
      created_at?: string;
      updated_at?: string;
    };
  };
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
  banca?: {
    id: number;
    nome: string;
    sigla: string;
    site: string;
    created_at: string;
    updated_at: string;
  };
} | null;

export type Questao = {
  id: number;
  prova_id: number | null;
  alternativa_correta_id: number;
  enunciado: string;
  gabarito_comentado_texto: string;
  gabarito_video: string | null;
  minutagem: number | null;
  tempo_resolucao?: number;
  dificuldade: number;
  adaptado?: boolean;
  created_at: string;
  updated_at: string;
  pivot?: {
    lista_id: number;
    questao_id: number;
    created_at: string;
    updated_at: string;
    order: number;
  };
  alternativas: Alternativa[];
  prova: Prova;
  topicos: Topico[];
};

// types/list.ts - ADICIONAR ESTES TIPOS

export type Assunto = {
  id: number;
  frente_id: number;
  nome: string;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    listable_type: string;
    lista_id: number;
    listable_id: number;
  };
  frente?: {
    id: number;
    nome: string;
    disciplina_id?: number;
    created_at?: string;
    updated_at?: string;
  };
};

export type Frente = {
  id: number;
  disciplina_id: number;
  nome: string;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    listable_type: string;
    lista_id: number;
    listable_id: number;
  };
};

export type TopicoCompleto = {
  id: number;
  assunto_id: number;
  nome: string;
  created_at?: string;
  updated_at?: string;
  pivot?: {
    listable_type: string;
    lista_id: number;
    listable_id: number;
  };
  assunto?: Assunto;
};

export type ListaCompleta = {
  id: number;
  nome: string;
  descricao?: string;
  total_time_in_seconds?: number;
  user_id?: number;
  is_public?: boolean;
  time?: number;
  tipo?: string;
  created_at?: string;
  updated_at?: string;
  average_difficulty?: number;
  most_frequent_assunto?: string | null;
  // ✅ ADICIONAR AS RELAÇÕES
  assuntos?: Assunto[];
  frentes?: Frente[];
  topicos?: TopicoCompleto[];
};