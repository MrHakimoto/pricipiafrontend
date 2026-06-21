// types/questions.ts

export type QuestaoTipo =
  | "objetiva"
  | "discursiva"
  | "resposta_numerica"
  | "certo_errado";

export type AlternativaBase = {
  id: number;
  letra: string;
  texto: string;
};

export type TopicoBase = {
  id: number;
  nome: string;
};

export type ProvaBase = {
  banca?: {
    nome: string;
  } | null;
  ano?: number | null;
  sigla?: string | null;
};

export type GabaritoCertoErrado = "certo" | "errado";

export type QuestaoBase = {
  id: number;
  tipo: QuestaoTipo;

  enunciado: string;
  dificuldade: number | null;

  /**
   * Usado apenas em questões objetivas.
   */
  alternativa_correta_id?: number | null;
  alternativas?: AlternativaBase[];

  /**
   * Usado principalmente em questões discursivas.
   */
  resposta_esperada?: string | null;
  criterio_correcao?: string | null;

  /**
   * Usado apenas em questões certo/errado.
   */
  gabarito_certo_errado?: GabaritoCertoErrado | null;

  /**
   * Usado apenas em questões de resposta numérica.
   */
  resposta_numerica?: string | null;

  topicos: TopicoBase[];

  prova?: ProvaBase | null;

  gabarito_video: string | null;
  gabarito_comentado_texto: string | null;

  adaptado: boolean;
};

export type RespostaQuestao =
  | {
      tipo: "objetiva";
      questao_id: number;
      alternativa_id: number | null;
      correta?: boolean | null;
    }
  | {
      tipo: "discursiva";
      questao_id: number;
      resposta_texto: string;
      correta: boolean;
    }
  | {
      tipo: "resposta_numerica";
      questao_id: number;
      resposta_numerica: string;
      correta?: boolean | null;
    }
  | {
      tipo: "certo_errado";
      questao_id: number;
      resposta_certo_errado: "certo" | "errado";
      correta?: boolean | null;
    };

export type RespostasPorQuestao = Record<number, RespostaQuestao>;