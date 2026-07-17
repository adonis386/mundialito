/**
 * Snapshot archivo Mundial 2026 (FIFA scores/fixtures).
 * Scores de fase de grupos mapeados a ids md*-NN por emparejamiento home/away.
 */

export type ArchiveScore = { home: number; away: number };

/** Resultados FT fase de grupos — clave = matchId. */
export const GROUP_FINAL_SCORES: Record<string, ArchiveScore> = {
  // Jornada 1
  "md1-01": { home: 2, away: 0 }, // México – Sudáfrica
  "md1-02": { home: 2, away: 1 }, // Corea – Chequia
  "md1-03": { home: 1, away: 1 }, // Canadá – Bosnia
  "md1-04": { home: 4, away: 1 }, // USA – Paraguay
  "md1-05": { home: 1, away: 1 }, // Catar – Suiza
  "md1-06": { home: 1, away: 1 }, // Brasil – Marruecos
  "md1-07": { home: 0, away: 1 }, // Haití – Escocia
  "md1-08": { home: 2, away: 0 }, // Australia – Turquía
  "md1-09": { home: 7, away: 1 }, // Alemania – Curazao
  "md1-10": { home: 2, away: 2 }, // Países Bajos – Japón
  "md1-11": { home: 1, away: 0 }, // Costa de Marfil – Ecuador
  "md1-12": { home: 5, away: 1 }, // Suecia – Túnez
  "md1-13": { home: 0, away: 0 }, // España – Cabo Verde
  "md1-14": { home: 1, away: 1 }, // Bélgica – Egipto
  "md1-15": { home: 1, away: 1 }, // Arabia Saudita – Uruguay
  "md1-16": { home: 2, away: 2 }, // Irán – Nueva Zelanda
  "md1-17": { home: 3, away: 1 }, // Francia – Senegal
  "md1-18": { home: 1, away: 4 }, // Irak – Noruega
  "md1-19": { home: 3, away: 0 }, // Argentina – Argelia
  "md1-20": { home: 3, away: 1 }, // Austria – Jordania
  "md1-21": { home: 1, away: 1 }, // Portugal – RD Congo
  "md1-22": { home: 4, away: 2 }, // Inglaterra – Croacia
  "md1-23": { home: 1, away: 0 }, // Ghana – Panamá
  "md1-24": { home: 1, away: 3 }, // Uzbekistán – Colombia

  // Jornada 2
  "md2-01": { home: 1, away: 1 }, // Chequia – Sudáfrica
  "md2-02": { home: 4, away: 1 }, // Suiza – Bosnia
  "md2-03": { home: 6, away: 0 }, // Canadá – Catar
  "md2-04": { home: 1, away: 0 }, // México – Corea
  "md2-05": { home: 2, away: 0 }, // USA – Australia
  "md2-06": { home: 0, away: 1 }, // Escocia – Marruecos
  "md2-07": { home: 3, away: 0 }, // Brasil – Haití
  "md2-08": { home: 0, away: 1 }, // Turquía – Paraguay
  "md2-09": { home: 5, away: 1 }, // Países Bajos – Suecia
  "md2-10": { home: 2, away: 1 }, // Alemania – Costa de Marfil
  "md2-11": { home: 0, away: 0 }, // Ecuador – Curazao
  "md2-12": { home: 0, away: 4 }, // Túnez – Japón
  "md2-13": { home: 4, away: 0 }, // España – Arabia Saudita
  "md2-14": { home: 0, away: 0 }, // Bélgica – Irán
  "md2-15": { home: 2, away: 2 }, // Uruguay – Cabo Verde
  "md2-16": { home: 1, away: 3 }, // Nueva Zelanda – Egipto
  "md2-17": { home: 2, away: 0 }, // Argentina – Austria
  "md2-18": { home: 3, away: 0 }, // Francia – Irak
  "md2-19": { home: 3, away: 2 }, // Noruega – Senegal
  "md2-20": { home: 1, away: 2 }, // Jordania – Argelia
  "md2-21": { home: 5, away: 0 }, // Portugal – Uzbekistán
  "md2-22": { home: 0, away: 0 }, // Inglaterra – Ghana
  "md2-23": { home: 0, away: 1 }, // Panamá – Croacia
  "md2-24": { home: 1, away: 0 }, // Colombia – RD Congo

  // Jornada 3
  "md3-01": { home: 2, away: 1 }, // Suiza – Canadá
  "md3-02": { home: 3, away: 1 }, // Bosnia – Catar
  "md3-03": { home: 4, away: 2 }, // Marruecos – Haití
  "md3-04": { home: 0, away: 3 }, // Escocia – Brasil
  "md3-05": { home: 1, away: 0 }, // Sudáfrica – Corea
  "md3-06": { home: 0, away: 3 }, // Chequia – México
  "md3-07": { home: 2, away: 1 }, // Ecuador – Alemania
  "md3-08": { home: 0, away: 2 }, // Curazao – Costa de Marfil
  "md3-09": { home: 1, away: 3 }, // Túnez – Países Bajos
  "md3-10": { home: 1, away: 1 }, // Japón – Suecia
  "md3-11": { home: 0, away: 0 }, // Paraguay – Australia
  "md3-12": { home: 3, away: 2 }, // Turquía – USA
  "md3-13": { home: 1, away: 4 }, // Noruega – Francia
  "md3-14": { home: 5, away: 0 }, // Senegal – Irak
  "md3-15": { home: 0, away: 1 }, // Uruguay – España
  "md3-16": { home: 0, away: 0 }, // Cabo Verde – Arabia Saudita
  "md3-17": { home: 1, away: 1 }, // Egipto – Irán
  "md3-18": { home: 1, away: 5 }, // Nueva Zelanda – Bélgica
  "md3-19": { home: 0, away: 2 }, // Panamá – Inglaterra
  "md3-20": { home: 2, away: 1 }, // Croacia – Ghana
  "md3-21": { home: 0, away: 0 }, // Colombia – Portugal
  "md3-22": { home: 3, away: 1 }, // RD Congo – Uzbekistán
  "md3-23": { home: 3, away: 3 }, // Argelia – Austria
  "md3-24": { home: 1, away: 3 }, // Jordania – Argentina
};

export type KnockoutStage = "round32" | "round16" | "qf" | "sf" | "third" | "final";

export type KnockoutArchiveMatch = {
  id: string;
  stage: KnockoutStage;
  roundLabel: string;
  homeNameEs: string;
  awayNameEs: string;
  kickoffAt: string; // ISO local-like America/Caracas display
  status: "scheduled" | "live" | "final";
  score?: ArchiveScore;
  /** Penales (ganador), si el partido se decidió en tanda. */
  pens?: ArchiveScore;
};

export const KNOCKOUT_ARCHIVE: KnockoutArchiveMatch[] = [
  // Round of 32
  {
    id: "ko-r32-01",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Sudáfrica",
    awayNameEs: "Canadá",
    kickoffAt: "2026-06-28T16:00:00",
    status: "final",
    score: { home: 0, away: 1 },
  },
  {
    id: "ko-r32-02",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Brasil",
    awayNameEs: "Japón",
    kickoffAt: "2026-06-29T16:00:00",
    status: "final",
    score: { home: 2, away: 1 },
  },
  {
    id: "ko-r32-03",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Alemania",
    awayNameEs: "Paraguay",
    kickoffAt: "2026-06-29T20:00:00",
    status: "final",
    score: { home: 1, away: 1 },
    pens: { home: 3, away: 4 },
  },
  {
    id: "ko-r32-04",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Países Bajos",
    awayNameEs: "Marruecos",
    kickoffAt: "2026-06-30T16:00:00",
    status: "final",
    score: { home: 1, away: 1 },
    pens: { home: 2, away: 3 },
  },
  {
    id: "ko-r32-05",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Costa de Marfil",
    awayNameEs: "Noruega",
    kickoffAt: "2026-06-30T20:00:00",
    status: "final",
    score: { home: 1, away: 2 },
  },
  {
    id: "ko-r32-06",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Francia",
    awayNameEs: "Suecia",
    kickoffAt: "2026-06-30T22:00:00",
    status: "final",
    score: { home: 3, away: 0 },
  },
  {
    id: "ko-r32-07",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "México",
    awayNameEs: "Ecuador",
    kickoffAt: "2026-07-01T16:00:00",
    status: "final",
    score: { home: 2, away: 0 },
  },
  {
    id: "ko-r32-08",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Inglaterra",
    awayNameEs: "RD Congo",
    kickoffAt: "2026-07-01T20:00:00",
    status: "final",
    score: { home: 2, away: 1 },
  },
  {
    id: "ko-r32-09",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Bélgica",
    awayNameEs: "Senegal",
    kickoffAt: "2026-07-01T22:00:00",
    status: "final",
    score: { home: 3, away: 2 },
  },
  {
    id: "ko-r32-10",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Estados Unidos",
    awayNameEs: "Bosnia y Herzegovina",
    kickoffAt: "2026-07-02T16:00:00",
    status: "final",
    score: { home: 2, away: 0 },
  },
  {
    id: "ko-r32-11",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "España",
    awayNameEs: "Austria",
    kickoffAt: "2026-07-02T20:00:00",
    status: "final",
    score: { home: 3, away: 0 },
  },
  {
    id: "ko-r32-12",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Portugal",
    awayNameEs: "Croacia",
    kickoffAt: "2026-07-02T22:00:00",
    status: "final",
    score: { home: 2, away: 1 },
  },
  {
    id: "ko-r32-13",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Suiza",
    awayNameEs: "Argelia",
    kickoffAt: "2026-07-03T16:00:00",
    status: "final",
    score: { home: 2, away: 0 },
  },
  {
    id: "ko-r32-14",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Australia",
    awayNameEs: "Egipto",
    kickoffAt: "2026-07-03T20:00:00",
    status: "final",
    score: { home: 1, away: 1 },
    pens: { home: 2, away: 4 },
  },
  {
    id: "ko-r32-15",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Argentina",
    awayNameEs: "Cabo Verde",
    kickoffAt: "2026-07-03T22:00:00",
    status: "final",
    score: { home: 3, away: 2 },
  },
  {
    id: "ko-r32-16",
    stage: "round32",
    roundLabel: "Dieciseisavos",
    homeNameEs: "Colombia",
    awayNameEs: "Ghana",
    kickoffAt: "2026-07-04T16:00:00",
    status: "final",
    score: { home: 1, away: 0 },
  },

  // Round of 16
  {
    id: "ko-r16-01",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Canadá",
    awayNameEs: "Marruecos",
    kickoffAt: "2026-07-04T20:00:00",
    status: "final",
    score: { home: 0, away: 3 },
  },
  {
    id: "ko-r16-02",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Paraguay",
    awayNameEs: "Francia",
    kickoffAt: "2026-07-04T22:00:00",
    status: "final",
    score: { home: 0, away: 1 },
  },
  {
    id: "ko-r16-03",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Brasil",
    awayNameEs: "Noruega",
    kickoffAt: "2026-07-05T16:00:00",
    status: "final",
    score: { home: 1, away: 2 },
  },
  {
    id: "ko-r16-04",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "México",
    awayNameEs: "Inglaterra",
    kickoffAt: "2026-07-06T16:00:00",
    status: "final",
    score: { home: 2, away: 3 },
  },
  {
    id: "ko-r16-05",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Portugal",
    awayNameEs: "España",
    kickoffAt: "2026-07-06T20:00:00",
    status: "final",
    score: { home: 0, away: 1 },
  },
  {
    id: "ko-r16-06",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Estados Unidos",
    awayNameEs: "Bélgica",
    kickoffAt: "2026-07-06T22:00:00",
    status: "final",
    score: { home: 1, away: 4 },
  },
  {
    id: "ko-r16-07",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Argentina",
    awayNameEs: "Egipto",
    kickoffAt: "2026-07-07T16:00:00",
    status: "final",
    score: { home: 3, away: 2 },
  },
  {
    id: "ko-r16-08",
    stage: "round16",
    roundLabel: "Octavos",
    homeNameEs: "Suiza",
    awayNameEs: "Colombia",
    kickoffAt: "2026-07-07T20:00:00",
    status: "final",
    score: { home: 0, away: 0 },
    pens: { home: 4, away: 3 },
  },

  // Quarter-finals
  {
    id: "ko-qf-01",
    stage: "qf",
    roundLabel: "Cuartos",
    homeNameEs: "Francia",
    awayNameEs: "Marruecos",
    kickoffAt: "2026-07-09T16:00:00",
    status: "final",
    score: { home: 2, away: 0 },
  },
  {
    id: "ko-qf-02",
    stage: "qf",
    roundLabel: "Cuartos",
    homeNameEs: "España",
    awayNameEs: "Bélgica",
    kickoffAt: "2026-07-10T16:00:00",
    status: "final",
    score: { home: 2, away: 1 },
  },
  {
    id: "ko-qf-03",
    stage: "qf",
    roundLabel: "Cuartos",
    homeNameEs: "Noruega",
    awayNameEs: "Inglaterra",
    kickoffAt: "2026-07-11T16:00:00",
    status: "final",
    score: { home: 1, away: 2 },
  },
  {
    id: "ko-qf-04",
    stage: "qf",
    roundLabel: "Cuartos",
    homeNameEs: "Argentina",
    awayNameEs: "Suiza",
    kickoffAt: "2026-07-12T16:00:00",
    status: "final",
    score: { home: 3, away: 1 },
  },

  // Semi-finals
  {
    id: "ko-sf-01",
    stage: "sf",
    roundLabel: "Semifinal",
    homeNameEs: "Francia",
    awayNameEs: "España",
    kickoffAt: "2026-07-14T15:00:00",
    status: "final",
    score: { home: 0, away: 2 },
  },
  {
    id: "ko-sf-02",
    stage: "sf",
    roundLabel: "Semifinal",
    homeNameEs: "Inglaterra",
    awayNameEs: "Argentina",
    kickoffAt: "2026-07-15T15:00:00",
    status: "final",
    score: { home: 1, away: 2 },
  },

  // Bronze + Final (pending as of 17 Jul 2026)
  {
    id: "ko-bronze",
    stage: "third",
    roundLabel: "3er puesto",
    homeNameEs: "Francia",
    awayNameEs: "Inglaterra",
    kickoffAt: "2026-07-18T17:00:00",
    status: "scheduled",
  },
  {
    id: "ko-final",
    stage: "final",
    roundLabel: "Final",
    homeNameEs: "España",
    awayNameEs: "Argentina",
    kickoffAt: "2026-07-19T15:00:00",
    status: "scheduled",
  },
];

export const KNOCKOUT_MATCH_IDS = KNOCKOUT_ARCHIVE.map((m) => m.id);
