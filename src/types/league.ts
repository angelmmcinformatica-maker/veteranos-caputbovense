export interface Match {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  date: string;
  time: string;
  status: 'PLAYED' | 'PENDING' | 'LIVE' | 'SCHEDULED' | 'POSTPONED';
  referee: string | null;
  refereeName: string | null;
}

export interface Matchday {
  id: string;
  jornada: number;
  date: string;
  matches: Match[];
  rest: string | null;
}

export interface Player {
  id: number | string;
  name: string;
  alias?: string | null;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'referee' | 'delegate';
  teamName?: string | null;
}

export interface MatchReportPlayer {
  id: number | string;
  name: string;
  matchNumber: number | string;
  isStarting: boolean;
  substitutionMin: string;
  goals: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  directRedCards: number;
  alias?: string;
}

export interface MatchReport {
  id: string;
  observations: string;
  [teamName: string]: {
    players: MatchReportPlayer[];
  } | string;
}

export interface PlayerPhoto {
  id: string;
  url: string;
}

// Calculated types
export interface TeamStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface TopScorer {
  name: string;
  team: string;
  goals: number;
  playerId?: string | number;
}

export interface CardRanking {
  name: string;
  team: string;
  yellowCards: number;
  redCards: number;
  playerId?: string | number;
}
