import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Match } from '@/types/league';
import { celestinoMeraVenue } from '@/lib/matchVenue';

const state = vi.hoisted(() => ({ admin: true, readOnly: false, fail: false, home: 'DOCENARIO ATLETICO', updates: [] as Array<Record<string, unknown>> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ currentUser: { uid: 'test' }, userData: { role: state.admin ? 'admin' : 'referee' }, isAdmin: state.admin }) }));
vi.mock('@/contexts/SeasonContext', () => ({ useSeason: () => ({ seasonId: '2026-2027', isReadOnly: state.readOnly }) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ collection, id }),
  runTransaction: async (_db: unknown, fn: (transaction: unknown) => Promise<void>) => {
    if (state.fail) throw new Error('Acceso denegado');
    await fn({ get: async () => ({ exists: () => true, data: () => ({ matches: [{ ...match, home: state.home }] }) }), update: (_ref: unknown, value: Record<string, unknown>) => state.updates.push(value) });
  },
}));
import { MatchVenueEditor } from '@/components/admin/MatchVenueEditor';
const match: Match = { home: 'DOCENARIO ATLETICO', away: 'AMAZONIA ORELLANA', homeGoals: 2, awayGoals: 1, status: 'PLAYED', date: '21-11-2026', time: '17:00', referee: 'ref', refereeName: 'Árbitro', autoLive: false };
const props = { match, matchday: { id: '10', jornada: 10, date: match.date, rest: null, matches: [match] } };
beforeEach(() => { state.admin = true; state.readOnly = false; state.fail = false; state.home = match.home; state.updates = []; });
describe('Guardar solo campo', () => {
  it('guarda solo la sede conservando 2–1, estado y árbitro', async () => {
    render(<MatchVenueEditor {...props} />);
    fireEvent.change(screen.getByLabelText('Nombre del campo'), { target: { value: 'Campo alternativo confirmado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar solo el campo' }));
    await waitFor(() => expect(state.updates).toEqual([{ matches: [{ ...match, venue: { name: 'Campo alternativo confirmado', locality: 'Quintana de la Serena, Badajoz', confirmed: true } }] }]));
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('no guarda una ubicación incompleta marcada como confirmada', () => {
    render(<MatchVenueEditor {...props} />);
    fireEvent.change(screen.getByLabelText('Población y provincia'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar solo el campo' }));
    expect(state.updates).toHaveLength(0);
  });
  it.each([
    { name: 'El Higueral', locality: 'Almoharín, Cáceres', confirmed: true, mapsQuery: 'Pabellón Multiusos de Almoharín', mapsNearbyReference: true },
    { name: 'Julián Lozano Pintado', locality: 'Valdehornillos, Badajoz', confirmed: true, mapsQuery: 'Estadio Las Amapolas, Valdehornillos' },
    celestinoMeraVenue,
  ])('conserva el destino Maps al guardar $name sin tocar resultado', async venue => {
    render(<MatchVenueEditor {...props} match={{ ...match, venue }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar solo el campo' }));
    await waitFor(() => expect(state.updates).toEqual([{ matches: [{ ...match, venue }] }]));
  });
  it('no muestra edición a árbitros', () => {
    state.admin = false;
    render(<MatchVenueEditor {...props} />);
    expect(screen.queryByRole('button', { name: 'Guardar solo el campo' })).toBeNull();
  });
  it('no guarda enlaces ajenos a Google Maps', () => {
    render(<MatchVenueEditor {...props} />);
    fireEvent.change(screen.getByLabelText('Enlace exacto de Google Maps (prioritario sobre la búsqueda)'), { target: { value: 'https://example.com/maps/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar solo el campo' }));
    expect(state.updates).toHaveLength(0);
  });
  it('Celestino Mera requiere selección y guardado explícitos', async () => {
    state.home = 'CENTROGLASS VULEBAR';
    render(<MatchVenueEditor {...props} match={{ ...match, home: 'CENTROGLASS VULEBAR' }} />);
    expect(screen.getByLabelText('Nombre del campo')).toHaveValue('');
    expect(state.updates).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar Celestino Mera para este partido' }));
    expect(state.updates).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar solo el campo' }));
    await waitFor(() => expect(state.updates).toEqual([{ matches: [{ ...match, home: 'CENTROGLASS VULEBAR', venue: celestinoMeraVenue }] }]));
  });
  it('no muestra edición en archivo', () => {
    state.readOnly = true;
    render(<MatchVenueEditor {...props} />);
    expect(screen.queryByRole('button', { name: 'Guardar solo el campo' })).toBeNull();
  });
  it('muestra el fallo de guardado sin indicar éxito', async () => {
    state.fail = true;
    render(<MatchVenueEditor {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar solo el campo' }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Acceso denegado'));
    expect(state.updates).toHaveLength(0);
  });
});