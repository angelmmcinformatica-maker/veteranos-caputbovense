import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSeason } from '@/contexts/SeasonContext';
import {
  getTeamName,
  getTeamRoster,
  isTeamActiveInSeason,
  LEGACY_SEASON_ID,
  PREVIOUS_SEASON_ID,
} from '@/config/seasons';
import type { Player, Team } from '@/types/league';

export interface AllTeamsEntry extends Team {
  /** Whether the team takes part in the currently selected season */
  active: boolean;
  /** Roster of the previous (historic) season */
  previousPlayers: Player[];
}

/**
 * Every team document in Firestore, including clubs archived for the active
 * season. Admin tools need these (transfers from retired clubs, player archive).
 */
export function useAllTeams() {
  const { seasonId } = useSeason();
  const [allTeams, setAllTeams] = useState<AllTeamsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(
        collection(db, 'teams'),
        (snap) => {
          try {
            const data = snap.docs.map((d) => {
              const raw = (d.data() as any) || {};
              const baseName = raw?.name ?? '';
              const rosters = { ...(raw?.rosters || {}), [LEGACY_SEASON_ID]: raw?.players || [] };
              return {
                ...raw,
                id: d.id,
                baseName,
                rosters,
                name: getTeamName(raw, seasonId),
                players: getTeamRoster<Player>(raw, seasonId),
                previousPlayers: (rosters?.[PREVIOUS_SEASON_ID] as Player[]) || [],
                active: isTeamActiveInSeason(baseName, seasonId),
              } as AllTeamsEntry;
            });
            setAllTeams(data);
          } catch (err) {
            console.error('[useAllTeams] parse error:', err);
          }
          setLoading(false);
        },
        (err) => {
          console.error('[useAllTeams] snapshot error:', err);
          setLoading(false);
        },
      );
    } catch (err) {
      console.error('[useAllTeams] setup error:', err);
      setLoading(false);
    }

    return () => {
      try { unsub?.(); } catch {}
    };
  }, [seasonId]);

  return { allTeams, loading };
}
