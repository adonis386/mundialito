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

export const MATCHDAY_2: MatchdayFixture[] = [
  {
    id: "md2-01",
    home: team({ nameEs: "República Checa", flag: "CZ", iso2: "CZ" }),
    away: team({ nameEs: "Sudáfrica", flag: "ZA", iso2: "ZA" }),
    kickoffAt: "2026-06-18T12:00:00",
  },
  {
    id: "md2-02",
    home: team({ nameEs: "Suiza", flag: "CH", iso2: "CH" }),
    away: team({ nameEs: "Bosnia y Herzegovina", flag: "BA", iso2: "BA" }),
    kickoffAt: "2026-06-18T15:00:00",
  },
  {
    id: "md2-03",
    home: team({ nameEs: "Canadá", flag: "CA", iso2: "CA" }),
    away: team({ nameEs: "Catar", flag: "QA", iso2: "QA" }),
    kickoffAt: "2026-06-18T18:00:00",
  },
  {
    id: "md2-04",
    home: team({ nameEs: "México", flag: "MX", iso2: "MX" }),
    away: team({ nameEs: "Corea del Sur", flag: "KR", iso2: "KR" }),
    kickoffAt: "2026-06-18T21:00:00",
  },
  {
    id: "md2-05",
    home: team({ nameEs: "Estados Unidos", flag: "US", iso2: "US" }),
    away: team({ nameEs: "Australia", flag: "AU", iso2: "AU" }),
    kickoffAt: "2026-06-19T15:00:00",
  },
  {
    id: "md2-06",
    home: team({ nameEs: "Escocia", flag: "GB_SCT" }),
    away: team({ nameEs: "Marruecos", flag: "MA", iso2: "MA" }),
    kickoffAt: "2026-06-19T18:00:00",
  },
  {
    id: "md2-07",
    home: team({ nameEs: "Brasil", flag: "BR", iso2: "BR" }),
    away: team({ nameEs: "Haití", flag: "HT", iso2: "HT" }),
    kickoffAt: "2026-06-19T20:30:00",
  },
  {
    id: "md2-08",
    home: team({ nameEs: "Turquía", flag: "TR", iso2: "TR" }),
    away: team({ nameEs: "Paraguay", flag: "PY", iso2: "PY" }),
    kickoffAt: "2026-06-19T23:00:00",
  },
  {
    id: "md2-09",
    home: team({ nameEs: "Países Bajos", flag: "NL", iso2: "NL" }),
    away: team({ nameEs: "Suecia", flag: "SE", iso2: "SE" }),
    kickoffAt: "2026-06-20T13:00:00",
  },
  {
    id: "md2-10",
    home: team({ nameEs: "Alemania", flag: "DE", iso2: "DE" }),
    away: team({ nameEs: "Costa de Marfil", flag: "CI", iso2: "CI" }),
    kickoffAt: "2026-06-20T16:00:00",
  },
  {
    id: "md2-11",
    home: team({ nameEs: "Ecuador", flag: "EC", iso2: "EC" }),
    away: team({ nameEs: "Curazao", flag: "CW", iso2: "CW" }),
    kickoffAt: "2026-06-20T20:00:00",
  },
  {
    id: "md2-12",
    home: team({ nameEs: "Túnez", flag: "TN", iso2: "TN" }),
    away: team({ nameEs: "Japón", flag: "JP", iso2: "JP" }),
    kickoffAt: "2026-06-21T00:00:00",
  },
  {
    id: "md2-13",
    home: team({ nameEs: "España", flag: "ES", iso2: "ES" }),
    away: team({ nameEs: "Arabia Saudita", flag: "SA", iso2: "SA" }),
    kickoffAt: "2026-06-21T12:00:00",
  },
  {
    id: "md2-14",
    home: team({ nameEs: "Bélgica", flag: "BE", iso2: "BE" }),
    away: team({ nameEs: "Irán", flag: "IR", iso2: "IR" }),
    kickoffAt: "2026-06-21T15:00:00",
  },
  {
    id: "md2-15",
    home: team({ nameEs: "Uruguay", flag: "UY", iso2: "UY" }),
    away: team({ nameEs: "Cabo Verde", flag: "CV", iso2: "CV" }),
    kickoffAt: "2026-06-21T18:00:00",
  },
  {
    id: "md2-16",
    home: team({ nameEs: "Nueva Zelanda", flag: "NZ", iso2: "NZ" }),
    away: team({ nameEs: "Egipto", flag: "EG", iso2: "EG" }),
    kickoffAt: "2026-06-21T21:00:00",
  },
  {
    id: "md2-17",
    home: team({ nameEs: "Argentina", flag: "AR", iso2: "AR" }),
    away: team({ nameEs: "Austria", flag: "AT", iso2: "AT" }),
    kickoffAt: "2026-06-22T13:00:00",
  },
  {
    id: "md2-18",
    home: team({ nameEs: "Francia", flag: "FR", iso2: "FR" }),
    away: team({ nameEs: "Irak", flag: "IQ", iso2: "IQ" }),
    kickoffAt: "2026-06-22T17:00:00",
  },
  {
    id: "md2-19",
    home: team({ nameEs: "Noruega", flag: "NO", iso2: "NO" }),
    away: team({ nameEs: "Senegal", flag: "SN", iso2: "SN" }),
    kickoffAt: "2026-06-22T20:00:00",
  },
  {
    id: "md2-20",
    home: team({ nameEs: "Jordania", flag: "JO", iso2: "JO" }),
    away: team({ nameEs: "Argelia", flag: "DZ", iso2: "DZ" }),
    kickoffAt: "2026-06-22T23:00:00",
  },
  {
    id: "md2-21",
    home: team({ nameEs: "Portugal", flag: "PT", iso2: "PT" }),
    away: team({ nameEs: "Uzbekistán", flag: "UZ", iso2: "UZ" }),
    kickoffAt: "2026-06-23T13:00:00",
  },
  {
    id: "md2-22",
    home: team({ nameEs: "Inglaterra", flag: "GB_ENG" }),
    away: team({ nameEs: "Ghana", flag: "GH", iso2: "GH" }),
    kickoffAt: "2026-06-23T16:00:00",
  },
  {
    id: "md2-23",
    home: team({ nameEs: "Panamá", flag: "PA", iso2: "PA" }),
    away: team({ nameEs: "Croacia", flag: "HR", iso2: "HR" }),
    kickoffAt: "2026-06-23T19:00:00",
  },
  {
    id: "md2-24",
    home: team({ nameEs: "Colombia", flag: "CO", iso2: "CO" }),
    away: team({ nameEs: "RD Congo", flag: "CD", iso2: "CD" }),
    kickoffAt: "2026-06-23T22:00:00",
  },
];

