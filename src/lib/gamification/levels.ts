export type LevelDefinition = {
  level: number;
  min: number;
  max: number | null;
  title: string;
};

export const LEVELS: LevelDefinition[] = [
  { level: 1, min: 0, max: 39, title: "Iniciante I" },
  { level: 2, min: 40, max: 89, title: "Iniciante II" },
  { level: 3, min: 90, max: 149, title: "Iniciante III" },
  { level: 4, min: 150, max: 229, title: "Aprendiz I" },
  { level: 5, min: 230, max: 329, title: "Aprendiz II" },

  { level: 6, min: 330, max: 449, title: "Aprendiz III" },
  { level: 7, min: 450, max: 589, title: "Estudante I" },
  { level: 8, min: 590, max: 749, title: "Estudante II" },
  { level: 9, min: 750, max: 929, title: "Estudante III" },
  { level: 10, min: 930, max: 1129, title: "Aplicado I" },

  { level: 11, min: 1130, max: 1349, title: "Aplicado II" },
  { level: 12, min: 1350, max: 1589, title: "Aplicado III" },
  { level: 13, min: 1590, max: 1849, title: "Dedicado I" },
  { level: 14, min: 1850, max: 2129, title: "Dedicado II" },
  { level: 15, min: 2130, max: 2429, title: "Dedicado III" },

  { level: 16, min: 2430, max: 2749, title: "Persistente I" },
  { level: 17, min: 2750, max: 3089, title: "Persistente II" },
  { level: 18, min: 3090, max: 3449, title: "Persistente III" },
  { level: 19, min: 3450, max: 3829, title: "Analítico I" },
  { level: 20, min: 3830, max: 4229, title: "Analítico II" },

  { level: 21, min: 4230, max: 4649, title: "Analítico III" },
  { level: 22, min: 4650, max: 5089, title: "Estrategista I" },
  { level: 23, min: 5090, max: 5549, title: "Estrategista II" },
  { level: 24, min: 5550, max: 6029, title: "Estrategista III" },
  { level: 25, min: 6030, max: 6529, title: "Resiliente I" },

  { level: 26, min: 6530, max: 7049, title: "Resiliente II" },
  { level: 27, min: 7050, max: 7589, title: "Resiliente III" },
  { level: 28, min: 7590, max: 8149, title: "Veterano I" },
  { level: 29, min: 8150, max: 8729, title: "Veterano II" },
  { level: 30, min: 8730, max: 9329, title: "Veterano III" },

  { level: 31, min: 9330, max: 9949, title: "Especialista I" },
  { level: 32, min: 9950, max: 10589, title: "Especialista II" },
  { level: 33, min: 10590, max: 11249, title: "Especialista III" },
  { level: 34, min: 11250, max: 11929, title: "Mestre I" },
  { level: 35, min: 11930, max: 12629, title: "Mestre II" },

  { level: 36, min: 12630, max: 13349, title: "Mestre III" },
  { level: 37, min: 13350, max: 14089, title: "Sábio I" },
  { level: 38, min: 14090, max: 14849, title: "Sábio II" },
  { level: 39, min: 14850, max: 15629, title: "Sábio III" },
  { level: 40, min: 15630, max: 16429, title: "Guardião I" },

  { level: 41, min: 16430, max: 16999, title: "Guardião II" },
  { level: 42, min: 17000, max: 17349, title: "Guardião III" },
  { level: 43, min: 17350, max: 17649, title: "Excelso I" },
  { level: 44, min: 17650, max: 17899, title: "Excelso II" },
  { level: 45, min: 17900, max: 18149, title: "Excelso III" },

  { level: 46, min: 18150, max: 18399, title: "Lendário I" },
  { level: 47, min: 18400, max: 18649, title: "Lendário II" },
  { level: 48, min: 18650, max: 18899, title: "Lendário III" },
  { level: 49, min: 18900, max: 18999, title: "Mítico" },
  { level: 50, min: 19000, max: null, title: "Principiano" },
];

export const DEFAULT_LEVEL = LEVELS[0];

export function getLevelDefinition(level?: number | null): LevelDefinition {
  const normalizedLevel = Number(level);

  if (!Number.isFinite(normalizedLevel)) {
    return DEFAULT_LEVEL;
  }

  return LEVELS.find((item) => item.level === normalizedLevel) ?? DEFAULT_LEVEL;
}

export function getLevelTitle(level?: number | null): string {
  return getLevelDefinition(level).title;
}

export function getLevelByPoints(points?: number | null): LevelDefinition {
  const normalizedPoints = Number(points ?? 0);

  if (!Number.isFinite(normalizedPoints) || normalizedPoints <= 0) {
    return DEFAULT_LEVEL;
  }

  return (
    LEVELS.find((item) => {
      const reachedMin = normalizedPoints >= item.min;
      const beforeMax = item.max === null || normalizedPoints <= item.max;

      return reachedMin && beforeMax;
    }) ?? DEFAULT_LEVEL
  );
}

export function getNextLevel(level?: number | null): LevelDefinition | null {
  const normalizedLevel = Number(level);

  if (!Number.isFinite(normalizedLevel)) {
    return LEVELS[1] ?? null;
  }

  return LEVELS.find((item) => item.level === normalizedLevel + 1) ?? null;
}

export function getLevelProgress(points?: number | null) {
  const current = getLevelByPoints(points);
  const next = getNextLevel(current.level);

  if (!next || current.max === null) {
    return {
      current,
      next: null,
      currentPoints: Number(points ?? 0),
      pointsIntoLevel: 0,
      pointsNeededForNext: 0,
      percentage: 100,
    };
  }

  const currentPoints = Math.max(0, Number(points ?? 0));
  const pointsIntoLevel = Math.max(0, currentPoints - current.min);
  const levelSpan = Math.max(1, next.min - current.min);
  const percentage = Math.min(100, Math.round((pointsIntoLevel / levelSpan) * 100));

  return {
    current,
    next,
    currentPoints,
    pointsIntoLevel,
    pointsNeededForNext: Math.max(0, next.min - currentPoints),
    percentage,
  };
}