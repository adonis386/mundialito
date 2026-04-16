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

export const MATCHDAY_3: MatchdayFixture[] = [
  {
    id: "md3-01",
    home: team({ nameEs: "Suiza", flag: "CH", iso2: "CH" }),
    away: team({ nameEs: "Canadá", flag: "CA", iso2: "CA" }),
    kickoffAt: "2026-06-24T15:00:00",
  },
  {
    id: "md3-02",
    home: team({ nameEs: "Bosnia y Herzegovina", flag: "BA", iso2: "BA" }),
    away: team({ nameEs: "Catar", flag: "QA", iso2: "QA" }),
    kickoffAt: "2026-06-24T15:00:00",
  },
  {
    id: "md3-03",
    home: team({ nameEs: "Marruecos", flag: "MA", iso2: "MA" }),
    away: team({ nameEs: "Haití", flag: "HT", iso2: "HT" }),
    kickoffAt: "2026-06-24T18:00:00",
  },
  {
    id: "md3-04",
    home: team({ nameEs: "Escocia", flag: "GB_SCT" }),
    away: team({ nameEs: "Brasil", flag: "BR", iso2: "BR" }),
    kickoffAt: "2026-06-24T18:00:00",
  },
  {
    id: "md3-05",
    home: team({ nameEs: "Sudáfrica", flag: "ZA", iso2: "ZA" }),
    away: team({ nameEs: "Corea del Sur", flag: "KR", iso2: "KR" }),
    kickoffAt: "2026-06-24T21:00:00",
  },
  {
    id: "md3-06",
    home: team({ nameEs: "República Checa", flag: "CZ", iso2: "CZ" }),
    away: team({ nameEs: "México", flag: "MX", iso2: "MX" }),
    kickoffAt: "2026-06-24T21:00:00",
  },
  {
    id: "md3-07",
    home: team({ nameEs: "Ecuador", flag: "EC", iso2: "EC" }),
    away: team({ nameEs: "Alemania", flag: "DE", iso2: "DE" }),
    kickoffAt: "2026-06-25T16:00:00",
  },
  {
    id: "md3-08",
    home: team({ nameEs: "Curazao", flag: "CW", iso2: "CW" }),
    away: team({ nameEs: "Costa de Marfil", flag: "CI", iso2: "CI" }),
    kickoffAt: "2026-06-25T16:00:00",
  },
  {
    id: "md3-09",
    home: team({ nameEs: "Túnez", flag: "TN", iso2: "TN" }),
    away: team({ nameEs: "Países Bajos", flag: "NL", iso2: "NL" }),
    kickoffAt: "2026-06-25T19:00:00",
  },
  {
    id: "md3-10",
    home: team({ nameEs: "Japón", flag: "JP", iso2: "JP" }),
    away: team({ nameEs: "Suecia", flag: "SE", iso2: "SE" }),
    kickoffAt: "2026-06-25T19:00:00",
  },
  {
    id: "md3-11",
    home: team({ nameEs: "Paraguay", flag: "PY", iso2: "PY" }),
    away: team({ nameEs: "Australia", flag: "AU", iso2: "AU" }),
    kickoffAt: "2026-06-25T22:00:00",
  },
  {
    id: "md3-12",
    home: team({ nameEs: "Turquía", flag: "TR", iso2: "TR" }),
    away: team({ nameEs: "Estados Unidos", flag: "US", iso2: "US" }),
    kickoffAt: "2026-06-25T22:00:00",
  },
  {
    id: "md3-13",
    home: team({ nameEs: "Noruega", flag: "NO", iso2: "NO" }),
    away: team({ nameEs: "Francia", flag: "FR", iso2: "FR" }),
    kickoffAt: "2026-06-26T15:00:00",
  },
  {
    id: "md3-14",
    home: team({ nameEs: "Senegal", flag: "SN", iso2: "SN" }),
    away: team({ nameEs: "Irak", flag: "IQ", iso2: "IQ" }),
    kickoffAt: "2026-06-26T15:00:00",
  },
  {
    id: "md3-15",
    home: team({ nameEs: "Uruguay", flag: "UY", iso2: "UY" }),
    away: team({ nameEs: "España", flag: "ES", iso2: "ES" }),
    kickoffAt: "2026-06-26T20:00:00",
  },
  {
    id: "md3-16",
    home: team({ nameEs: "Cabo Verde", flag: "CV", iso2: "CV" }),
    away: team({ nameEs: "Arabia Saudita", flag: "SA", iso2: "SA" }),
    kickoffAt: "2026-06-26T20:00:00",
  },
  {
    id: "md3-17",
    home: team({ nameEs: "Egipto", flag: "EG", iso2: "EG" }),
    away: team({ nameEs: "Irán", flag: "IR", iso2: "IR" }),
    kickoffAt: "2026-06-26T23:00:00",
  },
  {
    id: "md3-18",
    home: team({ nameEs: "Nueva Zelanda", flag: "NZ", iso2: "NZ" }),
    away: team({ nameEs: "Bélgica", flag: "BE", iso2: "BE" }),
    kickoffAt: "2026-06-26T23:00:00",
  },
  {
    id: "md3-19",
    home: team({ nameEs: "Panamá", flag: "PA", iso2: "PA" }),
    away: team({ nameEs: "Inglaterra", flag: "GB_ENG" }),
    kickoffAt: "2026-06-27T17:00:00",
  },
  {
    id: "md3-20",
    home: team({ nameEs: "Croacia", flag: "HR", iso2: "HR" }),
    away: team({ nameEs: "Ghana", flag: "GH", iso2: "GH" }),
    kickoffAt: "2026-06-27T17:00:00",
  },
  {
    id: "md3-21",
    home: team({ nameEs: "Colombia", flag: "CO", iso2: "CO" }),
    away: team({ nameEs: "Portugal", flag: "PT", iso2: "PT" }),
    kickoffAt: "2026-06-27T19:30:00",
  },
  {
    id: "md3-22",
    home: team({ nameEs: "RD Congo", flag: "CD", iso2: "CD" }),
    away: team({ nameEs: "Uzbekistán", flag: "UZ", iso2: "UZ" }),
    kickoffAt: "2026-06-27T19:30:00",
  },
  {
    id: "md3-23",
    home: team({ nameEs: "Argelia", flag: "DZ", iso2: "DZ" }),
    away: team({ nameEs: "Austria", flag: "AT", iso2: "AT" }),
    kickoffAt: "2026-06-27T22:00:00",
  },
  {
    id: "md3-24",
    home: team({ nameEs: "Jordania", flag: "JO", iso2: "JO" }),
    away: team({ nameEs: "Argentina", flag: "AR", iso2: "AR" }),
    kickoffAt: "2026-06-27T22:00:00",
  },
];

