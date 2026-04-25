import type { Matchday, Match } from '@/types/league';

// Virtual playoff "matchdays" used by the admin panel to reuse the existing
// AdminMatchesView/MatchEditModal flow. Each round is modeled as a Matchday so
// the admin can edit results, lineups and acta exactly like a regular match.
//
// Firestore IDs use the `playoff-` prefix so they can be filtered out of the
// public league views (see useLeagueData), and jornada numbers are placed in
// the 90+ range so they never collide with the regular league rounds.

const today = new Date();
const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

const blankMatch = (home: string, away: string): Match => ({
  home,
  away,
  homeGoals: 0,
  awayGoals: 0,
  date: dateStr,
  time: '',
  status: 'PENDING',
  referee: null,
  refereeName: null,
});

// ===== LIGA (1º-8º) =====
// IMPORTANT: Team names MUST match exactly the names stored in the Firestore
// 'teams' collection (UPPERCASE) so that MatchEditModal can resolve the roster
// via teams.find(t => t.name === match.home) and show the lineup editor.
export const PLAYOFF_LIGA_CUARTOS: Matchday = {
  id: 'playoff-liga-cuartos',
  jornada: 90,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('INTER DON BENITO POLO OPUESTO', 'VALDEHORNILLOS VETERANOS'),
    blankMatch('SANTA AMALIA VETERANOS', 'PALAZUELO SANTA TERESA'),
    blankMatch('TRANSTELLO MIAJADAS', 'TALARRUBIAS VETERANOS'),
    blankMatch('MESON LOS BARROS DON BENITO', 'VALDIVIA VETERANOS'),
  ],
};

export const PLAYOFF_LIGA_SEMIS: Matchday = {
  id: 'playoff-liga-semis',
  jornada: 91,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('Ganador Cuartos 1', 'Ganador Cuartos 2'),
    blankMatch('Ganador Cuartos 3', 'Ganador Cuartos 4'),
  ],
};

export const PLAYOFF_LIGA_FINAL: Matchday = {
  id: 'playoff-liga-final',
  jornada: 92,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('Ganador Semifinal 1', 'Ganador Semifinal 2'),
  ],
};

// ===== COPA (9º-24º) =====
export const PLAYOFF_COPA_OCTAVOS: Matchday = {
  id: 'playoff-copa-octavos',
  jornada: 93,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('CD GARGALIGAS', 'CAMPANARIO ATLETICO'),
    blankMatch('CD VETERANOS RUECAS', 'CP RENA'),
    blankMatch('AGRICOLA MERCHAN VVA.', 'SAN BARTOLOME VETERANOS'),
    blankMatch('AD ALCUESCAR', 'ZALAMEA VETERANOS'),
    blankMatch('VULEBAR TEXEIRA DON BENITO', 'CAMPANARIO INTERSERENA'),
    blankMatch('SPORTING DON BENITO', 'DOCENARIO ATLETICO'),
    blankMatch('AMAZONIA ORELLANA', 'V. BAR LA TASCA MIAJADAS'),
    blankMatch('AD CAPUTBOVENSE', 'HERNAN CORTES VETERANOS'),
  ],
};

export const PLAYOFF_COPA_CUARTOS: Matchday = {
  id: 'playoff-copa-cuartos',
  jornada: 94,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('Ganador Octavos 1', 'Ganador Octavos 2'),
    blankMatch('Ganador Octavos 3', 'Ganador Octavos 4'),
    blankMatch('Ganador Octavos 5', 'Ganador Octavos 6'),
    blankMatch('Ganador Octavos 7', 'Ganador Octavos 8'),
  ],
};

export const PLAYOFF_COPA_SEMIS: Matchday = {
  id: 'playoff-copa-semis',
  jornada: 95,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('Ganador Cuartos Copa 1', 'Ganador Cuartos Copa 2'),
    blankMatch('Ganador Cuartos Copa 3', 'Ganador Cuartos Copa 4'),
  ],
};

export const PLAYOFF_COPA_FINAL: Matchday = {
  id: 'playoff-copa-final',
  jornada: 96,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('Ganador Semifinal Copa 1', 'Ganador Semifinal Copa 2'),
  ],
};

export const PLAYOFF_DEFAULT_MATCHDAYS: Matchday[] = [
  PLAYOFF_LIGA_CUARTOS,
  PLAYOFF_LIGA_SEMIS,
  PLAYOFF_LIGA_FINAL,
  PLAYOFF_COPA_OCTAVOS,
  PLAYOFF_COPA_CUARTOS,
  PLAYOFF_COPA_SEMIS,
  PLAYOFF_COPA_FINAL,
];

// Friendly labels for each round (shown in the admin selector)
export const PLAYOFF_LABELS: Record<string, string> = {
  'playoff-liga-cuartos': '🏆 Liga · Cuartos de Final',
  'playoff-liga-semis': '🏆 Liga · Semifinales',
  'playoff-liga-final': '🏆 Liga · Gran Final',
  'playoff-copa-octavos': '🥈 Copa · Octavos de Final',
  'playoff-copa-cuartos': '🥈 Copa · Cuartos de Final',
  'playoff-copa-semis': '🥈 Copa · Semifinales',
  'playoff-copa-final': '🥈 Copa · Final',
};

export const PLAYOFF_ID_PREFIX = 'playoff-';
