import { StandingsTable } from '@/components/standings/StandingsTable';
import { Trophy, Award, XCircle } from 'lucide-react';
import type { TeamStanding } from '@/types/league';

interface StandingsViewProps {
  standings: TeamStanding[];
  onTeamClick?: (teamName: string) => void;
}

export function StandingsView({ standings, onTeamClick }: StandingsViewProps) {
  return (
    <div className="animate-fade-up">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Clasificación</h2>
        <p className="text-sm text-muted-foreground">Temporada 2025-2026</p>
      </div>

      {/* Legend */}
      <div className="glass-card p-3 mb-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/30" />
          <Trophy className="w-3 h-3 text-primary" />
          <span>1-8: Play-off título</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent/30" />
          <Award className="w-3 h-3 text-accent-foreground" />
          <span>9-24: Copa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive/30" />
          <XCircle className="w-3 h-3 text-destructive" />
          <span>25-27: Eliminados</span>
        </div>
      </div>

      <StandingsTable standings={standings} onTeamClick={onTeamClick} />
    </div>
  );
}
