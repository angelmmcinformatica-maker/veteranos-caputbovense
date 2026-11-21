import type { Match, MatchVenue, Team } from '@/types/league';

// Explicit fixture information only. A locality alone does not confirm a ground.
const confirmedJ10: Array<{ teams: [string, string]; venue: MatchVenue }> = [
  { teams: ['DOCENARIO ATLETICO', 'AMAZONIA ORELLANA'], venue: { name: 'Campo de fútbol de Quintana', locality: 'Quintana de la Serena, Badajoz', confirmed: true } },
  { teams: ['PALAZUELO SANTA TERESA', 'VETERANOS ZURBARAN'], venue: { name: '', locality: 'Valdivia, Badajoz', confirmed: false } },
  { teams: ['VALDEHORNILLOS VETERANOS', 'SPORTING DON BENITO'], venue: { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true } },
  { teams: ['SANTA AMALIA VETERANOS', 'VALDIVIA VETERANOS'], venue: { name: 'Campo de fútbol de césped artificial', locality: 'Santa Amalia, Badajoz', confirmed: true } },
];

export function withConfirmedMatchVenue(match: Match, seasonId: string, jornada: number): Match {
  if (match.venue != null || seasonId !== '2026-2027' || jornada !== 10) return match;
  const fixture = confirmedJ10.find(({ teams }) =>
    teams.includes(match.home) && teams.includes(match.away) && match.home !== match.away);
  return fixture ? { ...match, venue: { ...fixture.venue } } : match;
}

export function resolveMatchVenue(match: Match, homeTeam: Team | undefined, seasonId: string): MatchVenue | null {
  const venue = match.venue ?? homeTeam?.seasonVenues?.[seasonId];
  return venue?.confirmed && venue.name?.trim() && venue.locality?.trim() ? venue : null;
}

export function venueMapsUrl(venue: MatchVenue | null): string | null {
  if (!venue?.confirmed || !venue.name?.trim() || !venue.locality?.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name.trim()}, ${venue.locality.trim()}, España`)}`;
}

/** Change venue only, retaining all other fields from the latest stored match. */
export function replaceMatchVenue(matches: Match[], index: number, venue: MatchVenue): Match[] {
  if (!Number.isInteger(index) || index < 0 || index >= matches.length) throw new Error('Partido no encontrado');
  return matches.map((match, i) => i === index ? { ...match, venue } : match);
}