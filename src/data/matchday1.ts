import type { GroupTeam, GroupTeamFlagKey } from "@/data/groupStage2026";

export type MatchdayFixture = {
  id: string;
  home: GroupTeam;
  away: GroupTeam;
  kickoffAt: string; // ISO (local-like) used only for sorting/display
};

function team(params: { nameEs: string; flag: GroupTeamFlagKey; iso2?: string }): GroupTeam {
  return {
    nameEs: params.nameEs,
    flag: params.flag,
    iso2: params.iso2,
  };
}

export const MATCHDAY_1: MatchdayFixture[] = [
  {
    id: "md1-01",
    home: team({ nameEs: "México", flag: "MX", iso2: "MX" }),
    away: team({ nameEs: "Sudáfrica", flag: "ZA", iso2: "ZA" }),
    kickoffAt: "2026-06-11T15:00:00",
  },
  {
    id: "md1-02",
    home: team({ nameEs: "Corea del Sur", flag: "KR", iso2: "KR" }),
    away: team({ nameEs: "República Checa", flag: "CZ", iso2: "CZ" }),
    kickoffAt: "2026-06-11T22:00:00",
  },
  {
    id: "md1-03",
    home: team({ nameEs: "Canadá", flag: "CA", iso2: "CA" }),
    away: team({ nameEs: "Bosnia y Herzegovina", flag: "BA", iso2: "BA" }),
    kickoffAt: "2026-06-12T15:00:00",
  },
  {
    id: "md1-04",
    home: team({ nameEs: "Estados Unidos", flag: "US", iso2: "US" }),
    away: team({ nameEs: "Paraguay", flag: "PY", iso2: "PY" }),
    kickoffAt: "2026-06-12T21:00:00",
  },
  {
    id: "md1-05",
    home: team({ nameEs: "Catar", flag: "QA", iso2: "QA" }),
    away: team({ nameEs: "Suiza", flag: "CH", iso2: "CH" }),
    kickoffAt: "2026-06-13T15:00:00",
  },
  {
    id: "md1-06",
    home: team({ nameEs: "Brasil", flag: "BR", iso2: "BR" }),
    away: team({ nameEs: "Marruecos", flag: "MA", iso2: "MA" }),
    kickoffAt: "2026-06-13T18:00:00",
  },
  {
    id: "md1-07",
    home: team({ nameEs: "Haití", flag: "HT", iso2: "HT" }),
    away: team({ nameEs: "Escocia", flag: "GB_SCT" }),
    kickoffAt: "2026-06-13T21:00:00",
  },
  {
    id: "md1-08",
    home: team({ nameEs: "Australia", flag: "AU", iso2: "AU" }),
    away: team({ nameEs: "Turquía", flag: "TR", iso2: "TR" }),
    kickoffAt: "2026-06-14T00:00:00",
  },
  {
    id: "md1-09",
    home: team({ nameEs: "Alemania", flag: "DE", iso2: "DE" }),
    away: team({ nameEs: "Curazao", flag: "CW", iso2: "CW" }),
    kickoffAt: "2026-06-14T13:00:00",
  },
  {
    id: "md1-10",
    home: team({ nameEs: "Países Bajos", flag: "NL", iso2: "NL" }),
    away: team({ nameEs: "Japón", flag: "JP", iso2: "JP" }),
    kickoffAt: "2026-06-14T16:00:00",
  },
  {
    id: "md1-11",
    home: team({ nameEs: "Costa de Marfil", flag: "CI", iso2: "CI" }),
    away: team({ nameEs: "Ecuador", flag: "EC", iso2: "EC" }),
    kickoffAt: "2026-06-14T19:00:00",
  },
  {
    id: "md1-12",
    home: team({ nameEs: "Suecia", flag: "SE", iso2: "SE" }),
    away: team({ nameEs: "Túnez", flag: "TN", iso2: "TN" }),
    kickoffAt: "2026-06-14T22:00:00",
  },
  {
    id: "md1-13",
    home: team({ nameEs: "España", flag: "ES", iso2: "ES" }),
    away: team({ nameEs: "Cabo Verde", flag: "CV", iso2: "CV" }),
    kickoffAt: "2026-06-15T12:00:00",
  },
  {
    id: "md1-14",
    home: team({ nameEs: "Bélgica", flag: "BE", iso2: "BE" }),
    away: team({ nameEs: "Egipto", flag: "EG", iso2: "EG" }),
    kickoffAt: "2026-06-15T15:00:00",
  },
  {
    id: "md1-15",
    home: team({ nameEs: "Arabia Saudita", flag: "SA", iso2: "SA" }),
    away: team({ nameEs: "Uruguay", flag: "UY", iso2: "UY" }),
    kickoffAt: "2026-06-15T18:00:00",
  },
  {
    id: "md1-16",
    home: team({ nameEs: "Irán", flag: "IR", iso2: "IR" }),
    away: team({ nameEs: "Nueva Zelanda", flag: "NZ", iso2: "NZ" }),
    kickoffAt: "2026-06-15T21:00:00",
  },
  {
    id: "md1-17",
    home: team({ nameEs: "Francia", flag: "FR", iso2: "FR" }),
    away: team({ nameEs: "Senegal", flag: "SN", iso2: "SN" }),
    kickoffAt: "2026-06-16T15:00:00",
  },
  {
    id: "md1-18",
    home: team({ nameEs: "Irak", flag: "IQ", iso2: "IQ" }),
    away: team({ nameEs: "Noruega", flag: "NO", iso2: "NO" }),
    kickoffAt: "2026-06-16T18:00:00",
  },
  {
    id: "md1-19",
    home: team({ nameEs: "Argentina", flag: "AR", iso2: "AR" }),
    away: team({ nameEs: "Argelia", flag: "DZ", iso2: "DZ" }),
    kickoffAt: "2026-06-16T21:00:00",
  },
  {
    id: "md1-20",
    home: team({ nameEs: "Austria", flag: "AT", iso2: "AT" }),
    away: team({ nameEs: "Jordania", flag: "JO", iso2: "JO" }),
    kickoffAt: "2026-06-17T00:00:00",
  },
  {
    id: "md1-21",
    home: team({ nameEs: "Portugal", flag: "PT", iso2: "PT" }),
    away: team({ nameEs: "RD Congo", flag: "CD", iso2: "CD" }),
    kickoffAt: "2026-06-17T13:00:00",
  },
  {
    id: "md1-22",
    home: team({ nameEs: "Inglaterra", flag: "GB_ENG" }),
    away: team({ nameEs: "Croacia", flag: "HR", iso2: "HR" }),
    kickoffAt: "2026-06-17T16:00:00",
  },
  {
    id: "md1-23",
    home: team({ nameEs: "Ghana", flag: "GH", iso2: "GH" }),
    away: team({ nameEs: "Panamá", flag: "PA", iso2: "PA" }),
    kickoffAt: "2026-06-17T19:00:00",
  },
  {
    id: "md1-24",
    home: team({ nameEs: "Uzbekistán", flag: "UZ", iso2: "UZ" }),
    away: team({ nameEs: "Colombia", flag: "CO", iso2: "CO" }),
    kickoffAt: "2026-06-17T22:00:00",
  },
];

