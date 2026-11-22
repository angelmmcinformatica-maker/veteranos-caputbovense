import { describe, expect, it } from 'vitest';
import { celestinoMeraVenue, isGoogleMapsUrl, replaceMatchVenue, resolveMatchVenue, venueMapsUrl, withConfirmedMatchVenue } from '@/lib/matchVenue';
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
    expect(resolveMatchVenue({ ...base, home: 'EQUIPO SIN CAMPO' }, undefined, '2026-2027')).toBeNull();
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
    ['VETERANOS ALMOHARIN', 'El Higueral', 'Almoharín, Cáceres'],
    ['VALDEHORNILLOS VETERANOS', 'Julián Lozano Pintado', 'Valdehornillos, Badajoz'],
    ['PALAZUELO SANTA TERESA', 'Las Moreras', 'Palazuelo, Badajoz'],
    ['SANTA AMALIA VETERANOS', 'La Mesta', 'Santa Amalia, Badajoz'],
    ['TALARRUBIAS VETERANOS', 'Campo de fútbol municipal', 'Talarrubias, Badajoz'],
    ['VALDIVIA VETERANOS', 'Primero de Mayo', 'Valdivia, Badajoz'],
    ['SAN BARTOLOME VETERANOS', 'Campo de fútbol municipal', 'La Coronada, Badajoz'],
    ['VETERANOS ZURBARAN', 'La Pradera', 'Zurbarán, Badajoz'],
    ['AD ALCUESCAR', 'José Luis Moretón', 'Alcuéscar, Cáceres'],
    ['CD GARGALIGAS', 'Campo de fútbol municipal', 'Gargáligas, Badajoz'],
    ['CP RENA', 'Campo Municipal', 'Rena, Badajoz'],
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
    if (resolved?.mapsUrl) expect(url.href).toBe(resolved.mapsUrl);
    else expect(url.searchParams.get('query')).toBe(resolved?.mapsQuery ?? `${name}, ${locality}, España`);
    expect(resolveMatchVenue(match, undefined, '2025-2026')).toBeNull();
    expect(match).toEqual(original);
  });
  it('Almoharín usa el pabellón solo como referencia cercana', () => {
    const resolved = resolveMatchVenue({ ...base, home: 'VETERANOS ALMOHARIN' }, undefined, '2026-2027');
    expect(resolved?.mapsNearbyReference).toBe(true);
    expect(new URL(venueMapsUrl(resolved) ?? 'https://invalid.example').searchParams.get('query')).toBe('Pabellón Multiusos de Almoharín');
  });
  it.each(['CLINICA DENT. DOCTOR DOBLADO', 'ZALAMEA VETERANOS'])('no adivina sede habitual para %s', home => {
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
  it.each([
    ['AD ALCUESCAR', 'José Luis Moretón', 'Alcuéscar, Cáceres', 'https://www.google.com/maps/place/Campo+de+f%C3%BAtbol/data=!4m5!3m4!1s0xd15d3b9608b4553:0xe219edab883fab9e!8m2!3d39.1838942!4d-6.2390009'],
    ['HERNAN CORTES VETERANOS', 'Daniel, Gonzalo y Jorge', 'Hernán Cortés, Badajoz', 'https://www.google.com/maps/place/Estadio+Municipal+Hern%C3%A1n+Cort%C3%A9s/data=!4m5!3m4!1s0xd144fc5ce461f0d:0xda55a0847459e5e6!8m2!3d39.0301332!4d-5.9340478'],
    ['PALAZUELO SANTA TERESA', 'Las Moreras', 'Palazuelo, Badajoz', 'https://www.google.com/maps/place/Campo+de+f%C3%BAtbol+Las+Moreras/data=!4m5!3m4!1s0xd14550038dd738b:0x232b31de933b9a7!8m2!3d39.1104452!4d-5.737172'],
    ['DOCENARIO ATLETICO', 'Eusebio Mata', 'Zalamea de la Serena, Badajoz', 'https://www.google.com/maps/place/Campo+Municipal+de+futbol+Eusebio+Mata/data=!4m5!3m4!1s0xd14866eab2a12b7:0x973cc963d614a479!8m2!3d38.6575701!4d-5.662329'],
    ['V. BAR LA TASCA MIAJADAS', 'Campo de Césped Artificial', 'Miajadas, Cáceres', 'https://www.google.com/maps/place/Campo+de+C%C3%A9sped+Artificial/data=!4m5!3m4!1s0xd144df7a72b5943:0xc63bcbd134db59a9!8m2!3d39.1454887!4d-5.89895'],
    ['CP RENA', 'Campo Municipal', 'Rena, Badajoz', 'https://www.google.com/maps/place/Campo+de+F%C3%BAtbol+Municipal+de+Rena/data=!4m5!3m4!1s0xd14575e7900346d:0x530d61cf79ef0294!8m2!3d39.052546!4d-5.8033927'],
    ['AD CAPUTBOVENSE', 'Campo Municipal Cabeza del Buey', 'Cabeza del Buey, Badajoz', 'https://www.google.com/maps/place/Campo+de+F%C3%BAtbol+Municipal+de+Cabeza+del+Buey/data=!4m5!3m4!1s0xd14baa6e8e0dcc5:0xf072705aabc7d7c3!8m2!3d38.7172453!4d-5.2301453'],
  ])('%s conserva nombre y destino exacto confirmado', (home, name, locality, mapsUrl) => {
    const match = { ...base, home };
    const resolved = resolveMatchVenue(match, undefined, '2026-2027');
    expect(resolved).toEqual({ name, locality, confirmed: true, mapsUrl });
    expect(venueMapsUrl(resolved)).toBe(mapsUrl);
    expect(resolveMatchVenue(match, undefined, '2025-2026')).toBeNull();
    expect(resolveMatchVenue({ ...match, venue }, undefined, '2026-2027')).toEqual(venue);
  });
  it('Celestino Mera es el habitual de los equipos de Don Benito; la sede del partido prevalece', () => {
    expect(venueMapsUrl(celestinoMeraVenue)).toBe('https://www.google.com/maps/place/Campo+de+f%C3%BAtbol+Celestino+Mera/data=!4m5!3m4!1s0xd145b26da09e793:0xfa991bc8acb79511!8m2!3d38.9639961!4d-5.8658986');
    for (const home of ['GIMNASTICO D.B. VETERANOS', 'CENTROGLASS VULEBAR', 'MESON LOS BARROS DON BENITO', 'SPORTING DON BENITO']) {
      expect(resolveMatchVenue({ ...base, home }, undefined, '2026-2027')).toEqual(celestinoMeraVenue);
      expect(resolveMatchVenue({ ...base, home }, undefined, '2025-2026')).toBeNull();
      expect(resolveMatchVenue({ ...base, home, venue }, undefined, '2026-2027')).toEqual(venue);
    }
  });
  it.each(['javascript:alert(1)', 'https://www.google.com.evil.example/maps/place/test', 'https://evil.example/maps/', 'http://www.google.com/maps/place/test', 'https://www.google.com/search?q=test'])('rechaza destinos no válidos: %s', mapsUrl => {
    expect(isGoogleMapsUrl(mapsUrl)).toBe(false);
    expect(venueMapsUrl({ ...venue, mapsUrl })).toBeNull();
  });
});