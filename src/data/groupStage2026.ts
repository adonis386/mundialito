/**
 * Fase de grupos Mundial 2026 — 12 grupos (A–L), 4 selecciones por grupo.
 * `flag` es el nombre de exportación en `country-flag-icons/react/3x2` (p. ej. GB_SCT, KR).
 */
export type GroupId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type GroupTeam = {
  /** ISO 3166-1 alpha-2 cuando aplica (matriz master / Firestore); omitido si solo hay clave FIFA. */
  iso2?: string;
  /** Nombre en español (fuente de verdad para UI). */
  nameEs: string;
  /** Clave del componente bandera en country-flag-icons/react/3x2 */
  flag: GroupTeamFlagKey;
};

/** Subconjunto usado en esta quiniela (evita importar todo el barrel). */
export type GroupTeamFlagKey =
  | "KR"
  | "MX"
  | "CZ"
  | "ZA"
  | "BA"
  | "CH"
  | "CA"
  | "QA"
  | "BR"
  | "GB_SCT"
  | "HT"
  | "MA"
  | "AU"
  | "US"
  | "PY"
  | "TR"
  | "DE"
  | "CI"
  | "CW"
  | "EC"
  | "JP"
  | "NL"
  | "SE"
  | "TN"
  | "BE"
  | "EG"
  | "IR"
  | "NZ"
  | "SA"
  | "CV"
  | "ES"
  | "UY"
  | "FR"
  | "IQ"
  | "NO"
  | "SN"
  | "DZ"
  | "AR"
  | "AT"
  | "JO"
  | "CO"
  | "PT"
  | "CD"
  | "UZ"
  | "HR"
  | "GH"
  | "GB_ENG"
  | "PA";

export type GroupRow = {
  id: GroupId;
  label: string;
  teams: GroupTeam[];
};

export const GROUP_STAGE_2026: GroupRow[] = [
  {
    id: "A",
    label: "Grupo A",
    teams: [
      { iso2: "KR", nameEs: "Corea del Sur", flag: "KR" },
      { iso2: "MX", nameEs: "México", flag: "MX" },
      { iso2: "CZ", nameEs: "República Checa", flag: "CZ" },
      { iso2: "ZA", nameEs: "Sudáfrica", flag: "ZA" },
    ],
  },
  {
    id: "B",
    label: "Grupo B",
    teams: [
      { iso2: "BA", nameEs: "Bosnia y Herzegovina", flag: "BA" },
      { iso2: "CH", nameEs: "Suiza", flag: "CH" },
      { iso2: "CA", nameEs: "Canadá", flag: "CA" },
      { iso2: "QA", nameEs: "Catar", flag: "QA" },
    ],
  },
  {
    id: "C",
    label: "Grupo C",
    teams: [
      { iso2: "BR", nameEs: "Brasil", flag: "BR" },
      { nameEs: "Escocia", flag: "GB_SCT" },
      { iso2: "HT", nameEs: "Haití", flag: "HT" },
      { iso2: "MA", nameEs: "Marruecos", flag: "MA" },
    ],
  },
  {
    id: "D",
    label: "Grupo D",
    teams: [
      { iso2: "AU", nameEs: "Australia", flag: "AU" },
      { iso2: "US", nameEs: "Estados Unidos", flag: "US" },
      { iso2: "PY", nameEs: "Paraguay", flag: "PY" },
      { iso2: "TR", nameEs: "Turquía", flag: "TR" },
    ],
  },
  {
    id: "E",
    label: "Grupo E",
    teams: [
      { iso2: "DE", nameEs: "Alemania", flag: "DE" },
      { iso2: "CI", nameEs: "Costa de Marfil", flag: "CI" },
      { iso2: "CW", nameEs: "Curazao", flag: "CW" },
      { iso2: "EC", nameEs: "Ecuador", flag: "EC" },
    ],
  },
  {
    id: "F",
    label: "Grupo F",
    teams: [
      { iso2: "JP", nameEs: "Japón", flag: "JP" },
      { iso2: "NL", nameEs: "Países Bajos", flag: "NL" },
      { iso2: "SE", nameEs: "Suecia", flag: "SE" },
      { iso2: "TN", nameEs: "Túnez", flag: "TN" },
    ],
  },
  {
    id: "G",
    label: "Grupo G",
    teams: [
      { iso2: "BE", nameEs: "Bélgica", flag: "BE" },
      { iso2: "EG", nameEs: "Egipto", flag: "EG" },
      { iso2: "IR", nameEs: "Irán", flag: "IR" },
      { iso2: "NZ", nameEs: "Nueva Zelanda", flag: "NZ" },
    ],
  },
  {
    id: "H",
    label: "Grupo H",
    teams: [
      { iso2: "SA", nameEs: "Arabia Saudita", flag: "SA" },
      { iso2: "CV", nameEs: "Cabo Verde", flag: "CV" },
      { iso2: "ES", nameEs: "España", flag: "ES" },
      { iso2: "UY", nameEs: "Uruguay", flag: "UY" },
    ],
  },
  {
    id: "I",
    label: "Grupo I",
    teams: [
      { iso2: "FR", nameEs: "Francia", flag: "FR" },
      { iso2: "IQ", nameEs: "Irak", flag: "IQ" },
      { iso2: "NO", nameEs: "Noruega", flag: "NO" },
      { iso2: "SN", nameEs: "Senegal", flag: "SN" },
    ],
  },
  {
    id: "J",
    label: "Grupo J",
    teams: [
      { iso2: "DZ", nameEs: "Argelia", flag: "DZ" },
      { iso2: "AR", nameEs: "Argentina", flag: "AR" },
      { iso2: "AT", nameEs: "Austria", flag: "AT" },
      { iso2: "JO", nameEs: "Jordania", flag: "JO" },
    ],
  },
  {
    id: "K",
    label: "Grupo K",
    teams: [
      { iso2: "CO", nameEs: "Colombia", flag: "CO" },
      { iso2: "PT", nameEs: "Portugal", flag: "PT" },
      { iso2: "CD", nameEs: "RD Congo", flag: "CD" },
      { iso2: "UZ", nameEs: "Uzbekistán", flag: "UZ" },
    ],
  },
  {
    id: "L",
    label: "Grupo L",
    teams: [
      { iso2: "HR", nameEs: "Croacia", flag: "HR" },
      { iso2: "GH", nameEs: "Ghana", flag: "GH" },
      { nameEs: "Inglaterra", flag: "GB_ENG" },
      { iso2: "PA", nameEs: "Panamá", flag: "PA" },
    ],
  },
];
