// Multi-season configuration.
//
// The historic data already stored in Firestore (collections `matchdays` and
// `match_reports`) belongs to season 2025/2026 and is kept read-only.
// New seasons live in suffixed collections so nothing existing is ever touched.

export interface SeasonConfig {
  id: string;
  label: string;
  shortLabel: string;
  readOnly: boolean;
  /** Firestore collection holding matchdays for this season */
  matchdaysCollection: string;
  /** Firestore collection holding match reports for this season */
  reportsCollection: string;
}

export const SEASONS: SeasonConfig[] = [
  {
    id: '2026-2027',
    label: 'Temporada 2026/2027',
    shortLabel: '26/27',
    readOnly: false,
    matchdaysCollection: 'matchdays_2026_2027',
    reportsCollection: 'match_reports_2026_2027',
  },
  {
    id: '2025-2026',
    label: 'Temporada 2025/2026',
    shortLabel: '25/26',
    readOnly: true,
    matchdaysCollection: 'matchdays',
    reportsCollection: 'match_reports',
  },
];

export const CURRENT_SEASON_ID = '2026-2027';
export const PREVIOUS_SEASON_ID = '2025-2026';
export const LEGACY_SEASON_ID = PREVIOUS_SEASON_ID;

const STORAGE_KEY = 'caputbovense.activeSeason';

export function getSeason(seasonId?: string | null): SeasonConfig {
  return SEASONS.find((s) => s.id === seasonId) ?? SEASONS[0];
}

/** Active season id, readable outside React (Firestore helpers, hooks). */
export function getActiveSeasonId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SEASONS.some((s) => s.id === stored)) return stored;
  } catch {
    // localStorage unavailable (private mode / SSR)
  }
  return CURRENT_SEASON_ID;
}

export function persistActiveSeasonId(seasonId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, seasonId);
  } catch {
    // ignore
  }
}

export function matchdaysCollectionName(seasonId?: string | null): string {
  return getSeason(seasonId ?? getActiveSeasonId()).matchdaysCollection;
}

export function reportsCollectionName(seasonId?: string | null): string {
  return getSeason(seasonId ?? getActiveSeasonId()).reportsCollection;
}

export function isSeasonReadOnly(seasonId?: string | null): boolean {
  return getSeason(seasonId ?? getActiveSeasonId()).readOnly;
}

// ---------------------------------------------------------------------------
// Season-aware team helpers
// ---------------------------------------------------------------------------

interface SeasonAwareTeamDoc {
  name?: string;
  seasonNames?: Record<string, string> | null;
  rosters?: Record<string, unknown[]> | null;
  players?: unknown[] | null;
}

/** Display name of a team for a given season (falls back to the base name). */
export function getTeamName(team: SeasonAwareTeamDoc | null | undefined, seasonId?: string | null): string {
  const season = seasonId ?? getActiveSeasonId();
  return team?.seasonNames?.[season] ?? team?.name ?? '';
}

/** Roster of a team for a given season. Legacy season uses the `players` array. */
export function getTeamRoster<T = unknown>(
  team: SeasonAwareTeamDoc | null | undefined,
  seasonId?: string | null,
): T[] {
  const season = seasonId ?? getActiveSeasonId();
  if (season === LEGACY_SEASON_ID) return ((team?.players as T[]) ?? []);
  return ((team?.rosters?.[season] as T[]) ?? []);
}

/** Firestore field path used to persist the roster of a season. */
export function rosterFieldPath(seasonId?: string | null): string {
  const season = seasonId ?? getActiveSeasonId();
  return season === LEGACY_SEASON_ID ? 'players' : `rosters.${season}`;
}

/**
 * Team renames applied from 2026/2027 onwards. Historic seasons keep the old
 * name, so past standings and reports stay untouched.
 * Keys are the base `name` stored in the Firestore `teams` collection.
 */
export const SEASON_TEAM_RENAMES: Record<string, Record<string, string>> = {
  '2026-2027': {
    'TRANSTELLO MIAJADAS': 'CLINICA DENT. DOCTOR DOBLADO',
    'INTER DON BENITO POLO OPUESTO': 'GIMNASTICO D.B. VETERANOS',
    'INTER DON BENITO': 'GIMNASTICO D.B. VETERANOS',
  },
};

/**
 * Teams that do NOT take part in a given season (archived for that season).
 * Keys are the base `name` stored in Firestore.
 */
export const SEASON_INACTIVE_TEAMS: Record<string, string[]> = {
  '2026-2027': ['CD VETERANOS RUECAS'],
};

/** Whether a team participates in the given season. */
export function isTeamActiveInSeason(
  baseName: string | null | undefined,
  seasonId?: string | null,
): boolean {
  const season = seasonId ?? getActiveSeasonId();
  const inactive = SEASON_INACTIVE_TEAMS[season] ?? [];
  return !inactive.includes((baseName ?? '').trim().toUpperCase());
}

