import type { Matchday, Match } from '@/types/league';

/**
 * Resolves a single playoff match (by display home/away team names) against the
 * live Firestore playoff matchdays. Used by PlayoffsHero and PlayoffsView so
 * that as soon as the admin saves a goal/status change in Firestore, the
 * showcase and bracket update without a refresh.
 *
 * Matching is case-insensitive and accent/punctuation tolerant so that legacy
 * Title-Case bracket data still resolves to UPPERCASE Firestore docs.
 */
const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

export function findLivePlayoffMatch(
  playoffMatchdays: Matchday[] | undefined,
  home: string,
  away: string
): Match | null {
  if (!playoffMatchdays?.length) return null;
  const h = norm(home);
  const a = norm(away);
  for (const md of playoffMatchdays) {
    const m = md.matches?.find(
      (x) => norm(x.home) === h && norm(x.away) === a
    );
    if (m) return m;
  }
  return null;
}
