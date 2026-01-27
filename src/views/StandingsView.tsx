import { StandingsTable } from '@/components/standings/StandingsTable';
import type { TeamStanding } from '@/types/league';

interface StandingsViewProps {
  standings: TeamStanding[];
}

export function StandingsView({ standings }: StandingsViewProps) {
  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Clasificación</h2>
        <p className="text-sm text-muted-foreground">Temporada 2025-2026</p>
      </div>
      <StandingsTable standings={standings} />
    </div>
  );
}
