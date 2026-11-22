import type { Match, MatchVenue, Team } from '@/types/league';

// Exact current-season display names only; never infer a club's ground from a locality.
// User-supplied grounds with unambiguous club/locality correspondence. No database writes.
const habitualVenues: Record<string, MatchVenue> = {
  'VETERANOS ALMOHARIN': { name: 'La Higuerilla', locality: 'Almoharín, Cáceres', confirmed: true, mapsQuery: 'Pabellón Multiusos de Almoharín', mapsNearbyReference: true },
  'VALDEHORNILLOS VETERANOS': { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true, mapsQuery: 'Estadio Las Amapolas, Valdehornillos' },
  'PALAZUELO SANTA TERESA': { name: 'La Morera', locality: 'Palazuelo, Badajoz', confirmed: true },
  'SANTA AMALIA VETERANOS': { name: 'La Mesta', locality: 'Santa Amalia, Badajoz', confirmed: true },
  'TALARRUBIAS VETERANOS': { name: 'Campo de fútbol municipal', locality: 'Talarrubias, Badajoz', confirmed: true },
  'VALDIVIA VETERANOS': { name: 'Primero de Mayo', locality: 'Valdivia, Badajoz', confirmed: true },
  'SAN BARTOLOME VETERANOS': { name: 'Campo de fútbol municipal', locality: 'La Coronada, Badajoz', confirmed: true },
  'VETERANOS ZURBARAN': { name: 'La Pradera', locality: 'Zurbarán, Badajoz', confirmed: true },
  'AD ALCUESCAR': { name: 'José Luis Moretón', locality: 'Alcuéscar, Cáceres', confirmed: true },
  'CD GARGALIGAS': { name: 'Campo de fútbol municipal', locality: 'Gargáligas, Badajoz', confirmed: true },
  'CP RENA': { name: 'Campo de fútbol municipal', locality: 'Rena, Badajoz', confirmed: true },
  'CD ESTEBAN GOMEZ VET. EL TORVISCAL': { name: 'Campo de fútbol municipal', locality: 'El Torviscal, Badajoz', confirmed: true },
  'AMAZONIA ORELLANA': { name: 'Polideportivo municipal', locality: 'Orellana la Vieja, Badajoz', confirmed: true },
  'HERNAN CORTES VETERANOS': { name: 'Daniel, Gonzalo y Jorge', locality: 'Hernán Cortés, Badajoz', confirmed: true },
  'CAMPANARIO ATLETICO': { name: 'El Ejido', locality: 'Campanario, Badajoz', confirmed: true },
  'CAMPANARIO INTERSERENA': { name: 'El Ejido', locality: 'Campanario, Badajoz', confirmed: true },
  'AGRICOLA MERCHAN VVA.': { name: 'Anexo Villanovense', locality: 'Villanueva de la Serena, Badajoz', confirmed: true },
};

// Explicit fixture information only. A locality alone does not confirm a ground.
const confirmedJ10: Array<{ teams: [string, string]; venue: MatchVenue }> = [
  { teams: ['DOCENARIO ATLETICO', 'AMAZONIA ORELLANA'], venue: { name: 'Campo de fútbol de Quintana', locality: 'Quintana de la Serena, Badajoz', confirmed: true } },
  { teams: ['PALAZUELO SANTA TERESA', 'VETERANOS ZURBARAN'], venue: { name: '', locality: 'Valdivia, Badajoz', confirmed: false } },
  { teams: ['VALDEHORNILLOS VETERANOS', 'SPORTING DON BENITO'], venue: { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true, mapsQuery: 'Estadio Las Amapolas, Valdehornillos' } },
  { teams: ['SANTA AMALIA VETERANOS', 'VALDIVIA VETERANOS'], venue: { name: 'Campo de fútbol de césped artificial', locality: 'Santa Amalia, Badajoz', confirmed: true } },
];

export function withConfirmedMatchVenue(match: Match, seasonId: string, jornada: number): Match {
  if (match.venue != null || seasonId !== '2026-2027' || jornada !== 10) return match;
  const fixture = confirmedJ10.find(({ teams }) =>
    teams.includes(match.home) && teams.includes(match.away) && match.home !== match.away);
  return fixture ? { ...match, venue: { ...fixture.venue } } : match;
}

export function resolveMatchVenue(match: Match, homeTeam: Team | undefined, seasonId: string): MatchVenue | null {
  const venue = match.venue ?? homeTeam?.seasonVenues?.[seasonId]
    ?? (seasonId === '2026-2027' ? habitualVenues[match.home] : undefined);
  return venue?.confirmed && venue.name?.trim() && venue.locality?.trim() ? venue : null;
}

export function venueMapsUrl(venue: MatchVenue | null): string | null {
  if (!venue?.confirmed || !venue.name?.trim() || !venue.locality?.trim()) return null;
  const query = venue.mapsQuery?.trim() || `${venue.name.trim()}, ${venue.locality.trim()}, España`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Change venue only, retaining all other fields from the latest stored match. */
export function replaceMatchVenue(matches: Match[], index: number, venue: MatchVenue): Match[] {
  if (!Number.isInteger(index) || index < 0 || index >= matches.length) throw new Error('Partido no encontrado');
  return matches.map((match, i) => i === index ? { ...match, venue } : match);
}