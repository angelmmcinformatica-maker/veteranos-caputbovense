import { cn } from '@/lib/utils';
import type { TeamStanding } from '@/types/league';
import { FormIndicator } from './FormIndicator';
import { useTeamImages } from '@/hooks/useTeamImages';
import { Shield } from 'lucide-react';

interface StandingsTableProps {
  standings: TeamStanding[];
  onTeamClick?: (teamName: string) => void;
}

export function StandingsTable({ standings, onTeamClick }: StandingsTableProps) {
  const { getTeamShield } = useTeamImages();

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="standings-table">
          <thead>
            <tr className="border-b border-white/10 bg-secondary/30">
              <th className="text-left w-8">#</th>
              <th className="text-left">Equipo</th>
              <th className="text-center w-8">PJ</th>
              <th className="text-center w-8">G</th>
              <th className="text-center w-8">E</th>
              <th className="text-center w-8">P</th>
              <th className="text-center w-10">GF</th>
              <th className="text-center w-10">GC</th>
              <th className="text-center w-10">DG</th>
              <th className="text-center w-10 font-bold">PTS</th>
              <th className="text-center hidden sm:table-cell">Racha</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => {
              const shieldUrl = getTeamShield(team.team);
              return (
                <tr 
                  key={team.team}
                  className={cn(
                    index < 4 && 'bg-primary/5',
                    index >= standings.length - 3 && 'bg-destructive/5'
                  )}
                >
                  <td className={cn(
                    'font-semibold',
                    index < 4 && 'text-primary',
                    index >= standings.length - 3 && 'text-destructive'
                  )}>
                    {team.position}
                  </td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      {shieldUrl ? (
                        <img
                          src={shieldUrl}
                          alt={team.team}
                          className="w-6 h-6 object-contain rounded"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-secondary/50 flex items-center justify-center">
                          <Shield className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      {onTeamClick ? (
                        <button
                          onClick={() => onTeamClick(team.team)}
                          className="truncate max-w-[120px] sm:max-w-none hover:text-primary hover:underline transition-colors text-left"
                        >
                          {team.team}
                        </button>
                      ) : (
                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {team.team}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center text-muted-foreground">{team.played}</td>
                  <td className="text-center text-green-400">{team.won}</td>
                  <td className="text-center text-yellow-400">{team.drawn}</td>
                  <td className="text-center text-red-400">{team.lost}</td>
                  <td className="text-center">{team.goalsFor}</td>
                  <td className="text-center text-muted-foreground">{team.goalsAgainst}</td>
                  <td className={cn(
                    'text-center font-medium',
                    team.goalDifference > 0 && 'text-primary',
                    team.goalDifference < 0 && 'text-destructive'
                  )}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
                  <td className="text-center font-bold text-lg">{team.points}</td>
                  <td className="hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {team.form.map((result, i) => (
                        <FormIndicator key={i} result={result} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
