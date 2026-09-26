import { FollowTeamButton } from '@/components/notifications/FollowTeamButton';
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
    <div className="glass-card w-full min-w-0 max-w-full overflow-hidden">
      <div className="w-full min-w-0 max-w-full overflow-x-auto">
        <table className="standings-table table-fixed sm:table-auto">
          <thead>
            <tr className="border-b border-white/10 bg-secondary/30">
              <th className="text-left w-7 sm:w-8">#</th>
              <th className="text-left">Equipo</th>
              <th className="text-center w-9 sm:w-10 font-bold">PTS</th>
              <th className="text-center w-8">PJ</th>
              <th className="landscape-stat text-center w-8 hidden sm:table-cell">G</th>
              <th className="landscape-stat text-center w-8 hidden sm:table-cell">E</th>
              <th className="landscape-stat text-center w-8 hidden sm:table-cell">P</th>
              <th className="landscape-stat text-center w-10 hidden sm:table-cell">GF</th>
              <th className="landscape-stat text-center w-10 hidden sm:table-cell">GC</th>
              <th className="text-center w-9 sm:w-10">DG</th>
              <th className="text-center hidden sm:table-cell">Racha</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => {
              const shieldUrl = getTeamShield(team.team);
              // League zones: 1-8 playoffs (title), 9-24 cup, 25-27 eliminated
              const isPlayoff = team.position <= 8;
              const isCup = team.position >= 9 && team.position <= 24;
              const isRelegation = team.position >= 25;
              
              return (
                <tr 
                  key={team.team}
                  className={cn(
                    isPlayoff && 'bg-primary/5',
                    isCup && 'bg-accent/5',
                    isRelegation && 'bg-destructive/5'
                  )}
                >
                  <td className={cn(
                    'font-semibold',
                    isPlayoff && 'text-primary',
                    isCup && 'text-accent-foreground',
                    isRelegation && 'text-destructive'
                  )}>
                    {team.position}
                  </td>
                  <td className="font-medium">
                     <div className="flex w-full min-w-0 items-center gap-1 sm:gap-2">
                      {shieldUrl ? (
                        <img
                          src={shieldUrl}
                          alt={team.team}
                           className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 object-contain rounded"
                        />
                      ) : (
                         <div className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 rounded bg-secondary/50 flex items-center justify-center">
                          <Shield className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      {onTeamClick ? (
                        <button
                          onClick={() => onTeamClick(team.team)}
                           className="block min-w-0 flex-1 truncate hover:text-primary hover:underline transition-colors text-left"
                           title={team.team}
                        >
                          {team.team}
                        </button>
                      ) : (
                         <span className="block min-w-0 flex-1 truncate" title={team.team}>
                          {team.team}
                        </span>
                      )}
                      <FollowTeamButton team={team.team} compact />
                    </div>
                  </td>
                  <td className="text-center font-bold text-lg">{team.points}</td>
                  <td className="text-center text-muted-foreground">{team.played}</td>
                   <td className="landscape-stat text-center text-green-400 hidden sm:table-cell">{team.won}</td>
                   <td className="landscape-stat text-center text-yellow-400 hidden sm:table-cell">{team.drawn}</td>
                   <td className="landscape-stat text-center text-red-400 hidden sm:table-cell">{team.lost}</td>
                   <td className="landscape-stat text-center hidden sm:table-cell">{team.goalsFor}</td>
                   <td className="landscape-stat text-center text-muted-foreground hidden sm:table-cell">{team.goalsAgainst}</td>
                  <td className={cn(
                    'text-center font-medium',
                    team.goalDifference > 0 && 'text-primary',
                    team.goalDifference < 0 && 'text-destructive'
                  )}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
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
