import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import {
  SEASONS,
  SeasonConfig,
  getActiveSeasonId,
  getSeason,
  persistActiveSeasonId,
} from '@/config/seasons';

interface SeasonContextValue {
  seasons: SeasonConfig[];
  seasonId: string;
  season: SeasonConfig;
  isReadOnly: boolean;
  setSeasonId: (id: string) => void;
}

const SeasonContext = createContext<SeasonContextValue | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasonId, setSeasonIdState] = useState<string>(() => {
    try {
      return getActiveSeasonId();
    } catch {
      return SEASONS[0].id;
    }
  });

  const setSeasonId = useCallback((id: string) => {
    persistActiveSeasonId(id);
    setSeasonIdState(id);
  }, []);

  const value = useMemo<SeasonContextValue>(() => {
    const season = getSeason(seasonId);
    return {
      seasons: SEASONS,
      seasonId: season.id,
      season,
      isReadOnly: !!season.readOnly,
      setSeasonId,
    };
  }, [seasonId, setSeasonId]);

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export function useSeason(): SeasonContextValue {
  const ctx = useContext(SeasonContext);
  if (!ctx) {
    // Defensive fallback so a missing provider never crashes the app.
    const season = getSeason(undefined);
    return {
      seasons: SEASONS,
      seasonId: season.id,
      season,
      isReadOnly: !!season.readOnly,
      setSeasonId: () => {},
    };
  }
  return ctx;
}
