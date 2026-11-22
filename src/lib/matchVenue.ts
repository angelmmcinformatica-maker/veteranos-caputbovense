import type { Match, MatchVenue, Team } from '@/types/league';

// Exact current-season display names only; never infer a club's ground from a locality.
// User-supplied grounds with unambiguous club/locality correspondence. No database writes.
const habitualVenues: Record<string, MatchVenue> = {
  'VETERANOS ALMOHARIN': { name: 'El Higueral', locality: 'Almoharín, Cáceres', confirmed: true, mapsQuery: 'Pabellón Multiusos de Almoharín', mapsNearbyReference: true },
  'VALDEHORNILLOS VETERANOS': { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true, mapsQuery: 'Estadio Las Amapolas, Valdehornillos' },
  'PALAZUELO SANTA TERESA': { name: 'Las Moreras', locality: 'Palazuelo, Badajoz', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Campo+de+f%C3%BAtbol+Las+Moreras/data=!4m5!3m4!1s0xd14550038dd738b:0x232b31de933b9a7!8m2!3d39.1104452!4d-5.737172' },
  'SANTA AMALIA VETERANOS': { name: 'La Mesta', locality: 'Santa Amalia, Badajoz', confirmed: true },
  'TALARRUBIAS VETERANOS': { name: 'Campo de fútbol municipal', locality: 'Talarrubias, Badajoz', confirmed: true },
  'VALDIVIA VETERANOS': { name: 'Primero de Mayo', locality: 'Valdivia, Badajoz', confirmed: true },
  'SAN BARTOLOME VETERANOS': { name: 'Campo de fútbol municipal', locality: 'La Coronada, Badajoz', confirmed: true },
  'VETERANOS ZURBARAN': { name: 'La Pradera', locality: 'Zurbarán, Badajoz', confirmed: true },
  'AD ALCUESCAR': { name: 'José Luis Moretón', locality: 'Alcuéscar, Cáceres', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Campo+de+f%C3%BAtbol/data=!4m5!3m4!1s0xd15d3b9608b4553:0xe219edab883fab9e!8m2!3d39.1838942!4d-6.2390009' },
  'CD GARGALIGAS': { name: 'Campo de fútbol municipal', locality: 'Gargáligas, Badajoz', confirmed: true },
  'CP RENA': { name: 'Campo Municipal', locality: 'Rena, Badajoz', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Campo+de+F%C3%BAtbol+Municipal+de+Rena/data=!4m5!3m4!1s0xd14575e7900346d:0x530d61cf79ef0294!8m2!3d39.052546!4d-5.8033927' },
  'CD ESTEBAN GOMEZ VET. EL TORVISCAL': { name: 'Campo de fútbol municipal', locality: 'El Torviscal, Badajoz', confirmed: true },
  'AMAZONIA ORELLANA': { name: 'Polideportivo municipal', locality: 'Orellana la Vieja, Badajoz', confirmed: true },
  'HERNAN CORTES VETERANOS': { name: 'Daniel, Gonzalo y Jorge', locality: 'Hernán Cortés, Badajoz', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Estadio+Municipal+Hern%C3%A1n+Cort%C3%A9s/data=!4m5!3m4!1s0xd144fc5ce461f0d:0xda55a0847459e5e6!8m2!3d39.0301332!4d-5.9340478' },
  'CAMPANARIO ATLETICO': { name: 'El Ejido', locality: 'Campanario, Badajoz', confirmed: true },
  'CAMPANARIO INTERSERENA': { name: 'El Ejido', locality: 'Campanario, Badajoz', confirmed: true },
  'AGRICOLA MERCHAN VVA.': { name: 'Anexo Villanovense', locality: 'Villanueva de la Serena, Badajoz', confirmed: true },
  'DOCENARIO ATLETICO': { name: 'Eusebio Mata', locality: 'Zalamea de la Serena, Badajoz', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Campo+Municipal+de+futbol+Eusebio+Mata/data=!4m5!3m4!1s0xd14866eab2a12b7:0x973cc963d614a479!8m2!3d38.6575701!4d-5.662329' },
  'V. BAR LA TASCA MIAJADAS': { name: 'Campo de Césped Artificial', locality: 'Miajadas, Cáceres', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Campo+de+C%C3%A9sped+Artificial/data=!4m5!3m4!1s0xd144df7a72b5943:0xc63bcbd134db59a9!8m2!3d39.1454887!4d-5.89895' },
  'AD CAPUTBOVENSE': { name: 'Campo Municipal Cabeza del Buey', locality: 'Cabeza del Buey, Badajoz', confirmed: true, mapsUrl: 'https://www.google.com/maps/place/Campo+de+F%C3%BAtbol+Municipal+de+Cabeza+del+Buey/data=!4m5!3m4!1s0xd14baa6e8e0dcc5:0xf072705aabc7d7c3!8m2!3d38.7172453!4d-5.2301453' },
};

/** Offered for explicit per-match selection only, never an automatic team default. */
export const celestinoMeraVenue: MatchVenue = {
  name: 'Celestino Mera', locality: 'Don Benito, Badajoz', confirmed: true,
  mapsUrl: 'https://www.google.com/maps/place/Campo+de+f%C3%BAtbol+Celestino+Mera/data=!4m5!3m4!1s0xd145b26da09e793:0xfa991bc8acb79511!8m2!3d38.9639961!4d-5.8658986',
};

export function isGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.google.com'
      && url.pathname.startsWith('/maps/') && !url.username && !url.password && !url.port;
  } catch { return false; }
}

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
  if (venue.mapsUrl?.trim()) return isGoogleMapsUrl(venue.mapsUrl.trim()) ? venue.mapsUrl.trim() : null;
  const query = venue.mapsQuery?.trim() || `${venue.name.trim()}, ${venue.locality.trim()}, España`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Change venue only, retaining all other fields from the latest stored match. */
export function replaceMatchVenue(matches: Match[], index: number, venue: MatchVenue): Match[] {
  if (!Number.isInteger(index) || index < 0 || index >= matches.length) throw new Error('Partido no encontrado');
  return matches.map((match, i) => i === index ? { ...match, venue } : match);
}