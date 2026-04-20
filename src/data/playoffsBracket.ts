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
export const PLAYOFF_LIGA_CUARTOS: Matchday = {
  id: 'playoff-liga-cuartos',
  jornada: 90,
  date: dateStr,
  rest: null,
  matches: [
    blankMatch('Inter Don Benito Polo Opuesto', 'Valdehornillos Veteranos'),
    blankMatch('Santa Amalia Veteranos', 'Palazuelo Santa Teresa'),
    blankMatch('Transtello Miajadas', 'Talarrubias Veteranos'),
    blankMatch('Meson Los Barros Don Benito', 'Valdivia Veteranos'),
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
    blankMatch('CD Gargaligas', 'Campanario Atletico'),
    blankMatch('CD Veteranos Ruecas', 'CP Rena'),
    blankMatch('Agricola Merchan Vva.', 'San Bartolome Veteranos'),
    blankMatch('AD Alcuescar', 'Zalamea Veteranos'),
    blankMatch('Vulebar Texeira Don Benito', 'Campanario Interserena'),
    blankMatch('Sporting Don Benito', 'Docenario Atletico'),
    blankMatch('Amazonia Orellana', 'V. Bar La Tasca Miajadas'),
    blankMatch('AD Caputbovense', 'Hernan Cortes Veteranos'),
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
