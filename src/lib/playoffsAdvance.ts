import { deportividadData } from '@/data/deportividadData';
import type { Matchday, Match } from '@/types/league';

/**
 * Bracket progression map: defines, for each "source" match, which slot in the
 * next round it feeds into. Slot keys are `${nextMatchdayId}#${matchIndex}#${side}`
 * but we model it more conveniently below.
 */
export interface AdvanceSlot {
  nextMatchdayId: string;
  nextMatchIndex: number;
}

interface SourceRef {
  matchdayId: string;
  matchIndex: number;
}

interface BracketEdge {
  sourceA: SourceRef;
  sourceB: SourceRef;
  target: { matchdayId: string; matchIndex: number };
}

// LIGA edges
const LIGA_EDGES: BracketEdge[] = [
  // Cuartos -> Semis
  {
    sourceA: { matchdayId: 'playoff-liga-cuartos', matchIndex: 0 },
    sourceB: { matchdayId: 'playoff-liga-cuartos', matchIndex: 1 },
    target: { matchdayId: 'playoff-liga-semis', matchIndex: 0 },
  },
  {
    sourceA: { matchdayId: 'playoff-liga-cuartos', matchIndex: 2 },
    sourceB: { matchdayId: 'playoff-liga-cuartos', matchIndex: 3 },
    target: { matchdayId: 'playoff-liga-semis', matchIndex: 1 },
  },
  // Semis -> Final
  {
    sourceA: { matchdayId: 'playoff-liga-semis', matchIndex: 0 },
    sourceB: { matchdayId: 'playoff-liga-semis', matchIndex: 1 },
    target: { matchdayId: 'playoff-liga-final', matchIndex: 0 },
  },
];

// COPA edges
const COPA_EDGES: BracketEdge[] = [
  // Octavos -> Cuartos
  {
    sourceA: { matchdayId: 'playoff-copa-octavos', matchIndex: 0 },
    sourceB: { matchdayId: 'playoff-copa-octavos', matchIndex: 1 },
    target: { matchdayId: 'playoff-copa-cuartos', matchIndex: 0 },
  },
  {
    sourceA: { matchdayId: 'playoff-copa-octavos', matchIndex: 2 },
    sourceB: { matchdayId: 'playoff-copa-octavos', matchIndex: 3 },
    target: { matchdayId: 'playoff-copa-cuartos', matchIndex: 1 },
  },
  {
    sourceA: { matchdayId: 'playoff-copa-octavos', matchIndex: 4 },
    sourceB: { matchdayId: 'playoff-copa-octavos', matchIndex: 5 },
    target: { matchdayId: 'playoff-copa-cuartos', matchIndex: 2 },
  },
  {
    sourceA: { matchdayId: 'playoff-copa-octavos', matchIndex: 6 },
    sourceB: { matchdayId: 'playoff-copa-octavos', matchIndex: 7 },
    target: { matchdayId: 'playoff-copa-cuartos', matchIndex: 3 },
  },
  // Cuartos -> Semis
  {
    sourceA: { matchdayId: 'playoff-copa-cuartos', matchIndex: 0 },
    sourceB: { matchdayId: 'playoff-copa-cuartos', matchIndex: 1 },
    target: { matchdayId: 'playoff-copa-semis', matchIndex: 0 },
  },
  {
    sourceA: { matchdayId: 'playoff-copa-cuartos', matchIndex: 2 },
    sourceB: { matchdayId: 'playoff-copa-cuartos', matchIndex: 3 },
    target: { matchdayId: 'playoff-copa-semis', matchIndex: 1 },
  },
  // Semis -> Final
  {
    sourceA: { matchdayId: 'playoff-copa-semis', matchIndex: 0 },
    sourceB: { matchdayId: 'playoff-copa-semis', matchIndex: 1 },
    target: { matchdayId: 'playoff-copa-final', matchIndex: 0 },
  },
];

export const PLAYOFF_BRACKET_EDGES: BracketEdge[] = [...LIGA_EDGES, ...COPA_EDGES];

const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Pre-index fair play points by normalized team name so we can match
// UPPERCASE Firestore names against the Title-Case names in deportividadData.
const FAIR_PLAY_INDEX: Record<string, number> = {};
deportividadData.forEach((entry) => {
  FAIR_PLAY_INDEX[norm(entry.team)] = entry.totalPoints;
});

export function getFairPlayPoints(teamName?: string | null): number {
  if (!teamName) return 0;
  return FAIR_PLAY_INDEX?.[norm(teamName)] ?? 0;
}

/**
 * Decide which of the two qualified teams plays as LOCAL based on Fair Play.
 * Higher Fair Play points = home. Ties keep the first argument as home.
 * Defensive: missing names or undefined points fall back gracefully.
 */
export function decideHomeByFairPlay(
  teamA?: string | null,
  teamB?: string | null
): { home: string; away: string } {
  const safeA = teamA ?? '';
  const safeB = teamB ?? '';
  const a = getFairPlayPoints(safeA);
  const b = getFairPlayPoints(safeB);
  if (b > a) return { home: safeB, away: safeA };
  return { home: safeA, away: safeB };
}

/**
 * Returns the winner of a played match (status PLAYED), or null if there's no
 * decided winner yet (pending, live, draw, or missing data).
 */
export function getMatchWinner(m?: Match | null): string | null {
  if (!m) return null;
  if (m?.status !== 'PLAYED') return null;
  const hg = m?.homeGoals ?? 0;
  const ag = m?.awayGoals ?? 0;
  if (hg === ag) return null;
  if (!m?.home || !m?.away) return null;
  return hg > ag ? m.home : m.away;
}

const PLACEHOLDER_RE = /^ganador\s/i;
const isPlaceholder = (name: string) => !name || PLACEHOLDER_RE.test(name.trim());

interface ResolvedSlot {
  home: string | null; // null => "Esperando rival..."
  away: string | null;
}

/**
 * Computes who should occupy the target match slot based on the two source
 * matches. Returns nulls for teams that haven't qualified yet. When BOTH teams
 * are known, applies the fair play home/away rule.
 */
export function resolveTargetSlot(
  matchdays: Matchday[],
  edge: BracketEdge
): ResolvedSlot {
  const mdA = matchdays.find((m) => m.id === edge.sourceA.matchdayId);
  const mdB = matchdays.find((m) => m.id === edge.sourceB.matchdayId);
  const matchA = mdA?.matches?.[edge.sourceA.matchIndex];
  const matchB = mdB?.matches?.[edge.sourceB.matchIndex];

  const winA = getMatchWinner(matchA);
  const winB = getMatchWinner(matchB);

  if (winA && winB) {
    const { home, away } = decideHomeByFairPlay(winA, winB);
    return { home, away };
  }
  if (winA && !winB) return { home: winA, away: null };
  if (!winA && winB) return { home: winB, away: null };
  return { home: null, away: null };
}

/**
 * Determines if a target match in Firestore needs to be patched given the
 * resolved slot. Returns the new {home, away} (preserving existing values when
 * the resolution returns null) or null when no patch is needed.
 *
 * IMPORTANT: never overwrite a real team name with a placeholder; only replace
 * placeholders or stale teams with newly resolved winners.
 */
export function computePatch(
  current: Match,
  resolved: ResolvedSlot
): { home: string; away: string } | null {
  const desiredTeams = [resolved.home, resolved.away].filter(Boolean) as string[];
  if (desiredTeams.length === 0) return null;

  // Compute next desired pair. If only one is known, keep the other slot's
  // current value when it's already a real team OR fallback to placeholder text.
  let nextHome = current.home;
  let nextAway = current.away;

  if (resolved.home && resolved.away) {
    nextHome = resolved.home;
    nextAway = resolved.away;
  } else {
    const known = (resolved.home || resolved.away) as string;
    // If the known team is already placed (either side), keep current layout
    // and only ensure the other side displays "Esperando rival..." if it's not
    // a real team.
    const currentHomeIsReal = !isPlaceholder(current.home) && current.home !== 'Esperando rival...';
    const currentAwayIsReal = !isPlaceholder(current.away) && current.away !== 'Esperando rival...';

    if (currentHomeIsReal && current.home !== known && currentAwayIsReal && current.away !== known) {
      // Both slots have real but different teams (stale). Reset: place known as home.
      nextHome = known;
      nextAway = 'Esperando rival...';
    } else if (current.home === known) {
      nextHome = known;
      if (!currentAwayIsReal) nextAway = 'Esperando rival...';
    } else if (current.away === known) {
      nextAway = known;
      if (!currentHomeIsReal) nextHome = 'Esperando rival...';
    } else {
      // Known team not placed yet. Put it where there's a placeholder slot.
      if (!currentHomeIsReal) {
        nextHome = known;
        if (!currentAwayIsReal) nextAway = 'Esperando rival...';
      } else if (!currentAwayIsReal) {
        nextAway = known;
      }
    }
  }

  if (nextHome === current.home && nextAway === current.away) return null;
  return { home: nextHome, away: nextAway };
}
