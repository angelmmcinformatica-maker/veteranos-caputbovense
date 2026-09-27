import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('@/hooks/useTeamImages', () => ({ useTeamImages: () => ({ getTeamShield: () => undefined }) }));
import { MatchCard } from '@/components/matches/MatchCard';
import { hasConfirmedScore } from '@/lib/matchScore';
const base = { home: 'A', away: 'B', homeGoals: 0, awayGoals: 0, date: '', time: '', referee: null, refereeName: null } as any;
describe('auto live', () => {
  it('helper', () => {
    expect(hasConfirmedScore({ ...base, status: 'LIVE', autoLive: true })).toBe(false);
    expect(hasConfirmedScore({ ...base, status: 'LIVE', autoLive: false })).toBe(true);
    expect(hasConfirmedScore({ ...base, status: 'LIVE' })).toBe(true);
    expect(hasConfirmedScore({ ...base, status: 'LIVE', autoLive: true, homeGoals: 1 })).toBe(true);
    expect(hasConfirmedScore({ ...base, status: 'PLAYED', autoLive: true })).toBe(true);
  });
  it('card pending', () => {
    render(<MatchCard match={{ ...base, status: 'LIVE', autoLive: true }} />);
    expect(screen.getAllByText('Marcador pendiente').length).toBeGreaterThan(0);
  });
  it('card manual 0-0', () => {
    render(<MatchCard match={{ ...base, status: 'LIVE', autoLive: false }} />);
    expect(screen.queryByText('Marcador pendiente')).toBeNull();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
