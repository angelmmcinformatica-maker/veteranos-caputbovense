import { describe, expect, it } from 'vitest';
import { replaceMatchVenue, resolveMatchVenue, venueMapsUrl, withConfirmedMatchVenue } from '@/lib/matchVenue';
import type { Match, MatchVenue, Team } from '@/types/league';

const base: Match = { home: 'DOCENARIO ATLETICO', away: 'AMAZONIA ORELLANA', homeGoals: 2, awayGoals: 1, date: '', time: '', status: 'PLAYED', referee: null, refereeName: null };
const venue: MatchVenue = { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true };
describe('Sedes confirmadas', () => {
  it.each([
    ['DOCENARIO ATLETICO', 'AMAZONIA ORELLANA', 'Campo de fútbol de Quintana', 'Quintana de la Serena, Badajoz'],
    ['SANTA AMALIA VETERANOS', 'VALDIVIA VETERANOS', 'Campo de fútbol de césped artificial', 'Santa Amalia, Badajoz'],
  ])('J10 %s–%s apunta a %s', (home, away, name, locality) => {
    const match = withConfirmedMatchVenue({ ...base, home, away }, '2026-2027', 10);
    expect(match.venue).toEqual({ name, locality, confirmed: true });
    const url = new URL(venueMapsUrl(match.venue ?? null) ?? 'https://invalid.example');
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('query')).toBe(`${name}, ${locality}, España`);
  });
  it('Valdehornillos muestra Julián Lozano Pintado pero busca Estadio Las Amapolas', () => {
    const match = withConfirmedMatchVenue({ ...base, home: 'VALDEHORNILLOS VETERANOS', away: 'SPORTING DON BENITO' }, '2026-2027', 10);
    expect(match.venue).toEqual({ name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true, mapsQuery: 'Estadio Las Amapolas, Valdehornillos' });
    const url = new URL(venueMapsUrl(match.venue ?? null) ?? 'https://invalid.example');
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('query')).toBe('Estadio Las Amapolas, Valdehornillos');
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
  it.each([
    ['VETERANOS ALMOHARIN', 'La Higuerilla', 'Almoharín, Cáceres'],
    ['VALDEHORNILLOS VETERANOS', 'Julián Lozano Pintado', 'Valdehornillos, Badajoz'],
    ['PALAZUELO SANTA TERESA', 'La Morera', 'Palazuelo, Badajoz'],
    ['SANTA AMALIA VETERANOS', 'La Mesta', 'Santa Amalia, Badajoz'],
    ['TALARRUBIAS VETERANOS', 'Campo de fútbol municipal', 'Talarrubias, Badajoz'],
    ['VALDIVIA VETERANOS', 'Primero de Mayo', 'Valdivia, Badajoz'],
    ['SAN BARTOLOME VETERANOS', 'Campo de fútbol municipal', 'La Coronada, Badajoz'],
    ['VETERANOS ZURBARAN', 'La Pradera', 'Zurbarán, Badajoz'],
    ['AD ALCUESCAR', 'José Luis Moretón', 'Alcuéscar, Cáceres'],
    ['CD GARGALIGAS', 'Campo de fútbol municipal', 'Gargáligas, Badajoz'],
    ['CP RENA', 'Campo de fútbol municipal', 'Rena, Badajoz'],
    ['CD ESTEBAN GOMEZ VET. EL TORVISCAL', 'Campo de fútbol municipal', 'El Torviscal, Badajoz'],
    ['AMAZONIA ORELLANA', 'Polideportivo municipal', 'Orellana la Vieja, Badajoz'],
    ['HERNAN CORTES VETERANOS', 'Daniel, Gonzalo y Jorge', 'Hernán Cortés, Badajoz'],
    ['CAMPANARIO ATLETICO', 'El Ejido', 'Campanario, Badajoz'],
    ['CAMPANARIO INTERSERENA', 'El Ejido', 'Campanario, Badajoz'],
    ['AGRICOLA MERCHAN VVA.', 'Anexo Villanovense', 'Villanueva de la Serena, Badajoz'],
  ])('habitual de %s: %s sin cambiar el partido ni el archivo', (home, name, locality) => {
    const match = { ...base, home };
    const original = structuredClone(match);
    const resolved = resolveMatchVenue(match, undefined, '2026-2027');
    expect(resolved).toMatchObject({ name, locality, confirmed: true });
    const url = new URL(venueMapsUrl(resolved) ?? 'https://invalid.example');
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('query')).toBe(resolved?.mapsQuery ?? `${name}, ${locality}, España`);
    expect(resolveMatchVenue(match, undefined, '2025-2026')).toBeNull();
    expect(match).toEqual(original);
  });
  it('Almoharín usa el pabellón solo como referencia cercana', () => {
    const resolved = resolveMatchVenue({ ...base, home: 'VETERANOS ALMOHARIN' }, undefined, '2026-2027');
    expect(resolved?.mapsNearbyReference).toBe(true);
    expect(new URL(venueMapsUrl(resolved) ?? 'https://invalid.example').searchParams.get('query')).toBe('Pabellón Multiusos de Almoharín');
  });
  it.each(['GIMNASTICO D.B. VETERANOS', 'MESON LOS BARROS DON BENITO', 'SPORTING DON BENITO', 'CENTROGLASS VULEBAR', 'CLINICA DENT. DOCTOR DOBLADO', 'V. BAR LA TASCA MIAJADAS', 'AD CAPUTBOVENSE', 'DOCENARIO ATLETICO', 'ZALAMEA VETERANOS'])('no adivina sede habitual para %s', home => {
    expect(resolveMatchVenue({ ...base, home }, undefined, '2026-2027')).toBeNull();
  });
  it('la sede habitual guardada prevalece sobre la configuración y una excepción pendiente sobre ambas', () => {
    const home = 'PALAZUELO SANTA TERESA';
    const homeTeam: Team = { id: '1', name: home, players: [], seasonVenues: { '2026-2027': venue } };
    expect(resolveMatchVenue({ ...base, home }, homeTeam, '2026-2027')).toEqual(venue);
    const exceptional = withConfirmedMatchVenue({ ...base, home, away: 'VETERANOS ZURBARAN' }, '2026-2027', 10);
    expect(resolveMatchVenue(exceptional, homeTeam, '2026-2027')).toBeNull();
    expect(resolveMatchVenue({ ...exceptional, home: 'VALDIVIA VETERANOS' }, undefined, '2026-2027')).toBeNull();
    expect(resolveMatchVenue({ ...base, home, venue }, undefined, '2026-2027')).toEqual(venue);
  });
});