import type { MatchReport, Team } from '@/types/league';
import type { FairPlayEntry } from '@/data/deportividadData';

const normalize = (name: string) => name.trim().toLocaleUpperCase();
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

/** Derive only recorded discipline from the selected season's reports. */
export function fairPlayFromReports(teams: Team[], reports: MatchReport[]): FairPlayEntry[] {
  const byName = new Map<string, FairPlayEntry>();
  const aliases = new Map<string, string>();
  teams.forEach(team => {
    byName.set(team.name, { team: team.name, yellowCards: 0, redCards: 0, sanctionPoints: 0, totalPoints: 0 });
    aliases.set(normalize(team.name), team.name);
    if (team.baseName) aliases.set(normalize(team.baseName), team.name);
  });

  reports.forEach(report => {
    Object.entries(report).forEach(([key, value]) => {
      if (key === 'id' || key === 'observations' || !value || typeof value !== 'object') return;
      const teamName = aliases.get(normalize(key));
      const entry = teamName ? byName.get(teamName) : undefined;
      if (!entry) return;
      const data = value as { players?: unknown; sanctionPoints?: unknown };
      entry.sanctionPoints += count(data.sanctionPoints);
      if (!Array.isArray(data.players)) return;
      data.players.forEach((player: unknown) => {
        if (!player || typeof player !== 'object') return;
        const p = player as { yellowCards?: unknown; redCards?: unknown; directRedCards?: unknown; sanctionPoints?: unknown };
        entry.yellowCards += count(p.yellowCards);
        entry.redCards += count(p.redCards) + count(p.directRedCards);
        entry.sanctionPoints += count(p.sanctionPoints);
      });
    });
  });

  return [...byName.values()].map(entry => ({
    ...entry,
    // Existing card ranking uses one point per yellow and three per red.
    // No starting balance or unrecorded disciplinary penalties are assumed.
    totalPoints: -(entry.yellowCards + entry.redCards * 3 + entry.sanctionPoints),
  }));
}