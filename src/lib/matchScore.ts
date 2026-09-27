import type { Match } from '@/types/league';

/**
 * True when the stored score is a real (manually saved) score.
 * Matches switched to LIVE only by the automatic kick-off timer carry
 * `autoLive: true` until an admin saves anything; legacy matches lack the
 * flag and keep their historic behaviour.
 */
export function hasConfirmedScore(match: Partial<Match> | null | undefined): boolean {
  if (!match) return false;
  if (match.status === 'PLAYED') return true;
  if (match.status === 'LIVE') {
    if (match.autoLive !== true) return true;
    return (match.homeGoals || 0) + (match.awayGoals || 0) > 0;
  }
  return false;
}
