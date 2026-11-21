import { describe, expect, it } from 'vitest';
import { replaceMatchVenue, resolveMatchVenue, venueMapsUrl, withConfirmedMatchVenue } from '@/lib/matchVenue';
import type { Match, MatchVenue, Team } from '@/types/league';

const base: Match = { home: 'DOCENARIO ATLETICO', away: 'AMAZONIA ORELLANA', homeGoals: 2, awayGoals: 1, date: '', time: '', status: 'PLAYED', referee: null, refereeName: null };
const venue: MatchVenue = { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true };
describe('Sedes confirmadas', () => {
  it.each([
    ['DOCENARIO ATLETICO', 'AMAZONIA ORELLANA', 'Campo de fútbol de Quintana', 'Quintana de la Serena, Badajoz'],
    ['VALDEHORNILLOS VETERANOS', 'SPORTING DON BENITO', 'Julián Lozano Pintado', 'Valdehornillos, Badajoz'],
    ['SANTA AMALIA VETERANOS', 'VALDIVIA VETERANOS', 'Campo de fútbol de césped artificial', 'Santa Amalia, Badajoz'],
  ])('J10 %s–%s apunta a %s', (home, away, name, locality) => {
    const match = withConfirmedMatchVenue({ ...base, home, away }, '2026-2027', 10);
    expect(match.venue).toEqual({ name, locality, confirmed: true });
    const url = new URL(venueMapsUrl(match.venue ?? null) ?? 'https://invalid.example');
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('query')).toBe(`${name}, ${locality}, España`);
  });
  it('Palazuelo–Zurbarán conserva Valdivia sin adivinar el campo exacto', () => {
    const match = withConfirmedMatchVenue({ ...base, home: 'PALAZUELO SANTA TERESA', away: 'VETERANOS ZURBARAN' }, '2026-2027', 10);
    expect(match.venue).toEqual({ name: '', locality: 'Valdivia, Badajoz', confirmed: false });
    expect(venueMapsUrl(match.venue ?? null)).toBeNull();
  });
  it('la sede del partido prevalece sobre el habitual', () => {
    const homeTeam: Team = { id: '1', name: base.home, players: [], seasonVenues: { '2026-2027': venue } };
    const match = withConfirmedMatchVenue(base, '2026-2027', 10);
    expect(resolveMatchVenue(match, homeTeam, '2026-2027')?.locality).toBe('Quintana de la Serena, Badajoz');
    expect(resolveMatchVenue(base, homeTeam, '2026-2027')).toEqual(venue);
  });
  it('no asigna campos por nombres, otras jornadas ni históricos', () => {
    expect(withConfirmedMatchVenue(base, '2025-2026', 10).venue).toBeUndefined();
    expect(withConfirmedMatchVenue(base, '2026-2027', 9).venue).toBeUndefined();
    expect(resolveMatchVenue(base, undefined, '2026-2027')).toBeNull();
  });
  it('campo no confirmado impide enlace y fallback habitual', () => {
    const homeTeam: Team = { id: '1', name: base.home, players: [], seasonVenues: { '2026-2027': venue } };
    const match = { ...base, venue: { name: '', locality: '', confirmed: false } };
    expect(withConfirmedMatchVenue(match, '2026-2027', 10)).toEqual(match);
    expect(resolveMatchVenue(match, homeTeam, '2026-2027')).toBeNull();
    expect(venueMapsUrl(match.venue)).toBeNull();
  });
  it('conserva la sede al cambiar el local y permite corregir una excepción', () => {
    const match = withConfirmedMatchVenue(base, '2026-2027', 10);
    expect(withConfirmedMatchVenue({ ...match, home: base.away, away: base.home }, '2026-2027', 10).venue).toEqual(match.venue);
    expect(withConfirmedMatchVenue({ ...match, venue }, '2026-2027', 10).venue).toEqual(venue);
  });
  it('guardar campo conserva resultados y todos los demás campos', () => {
    const match = { ...base, homePenalties: 5, awayPenalties: 4, autoLive: false };
    expect(replaceMatchVenue([match, base], 0, venue)).toEqual([{ ...match, venue }, base]);
    expect(() => replaceMatchVenue([base], -1, venue)).toThrow('Partido no encontrado');
  });
});