import { useState } from 'react';
import { FollowTeamButton } from '@/components/notifications/FollowTeamButton';
import { cn } from '@/lib/utils';
import type { TeamStanding } from '@/types/league';
import { FormIndicator } from './FormIndicator';
import { useTeamImages } from '@/hooks/useTeamImages';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamShield } from '@/components/teams/TeamShield';

interface StandingsTableProps {
  standings: TeamStanding[];
  onTeamClick?: (teamName: string) => void;
}

export function StandingsTable({ standings, onTeamClick }: StandingsTableProps) {
  const { getTeamShield } = useTeamImages();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

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
            {standings.map((team) => {
              const shieldUrl = getTeamShield(team.team);
              // League zones: 1-8 playoffs (title), 9-24 cup, 25-27 eliminated
              const isPlayoff = team.position <= 8;
              const isCup = team.position >= 9 && team.position <= 24;
              const isRelegation = team.position >= 25;
              
              const form = [...Array(Math.max(0, 5 - (team.form?.length ?? 0))).fill('?'), ...(team.form ?? [])] as ('W' | 'D' | 'L' | '?')[];
              const expanded = expandedTeam === team.team;
              return (
                <tbody key={team.team}>
                <tr 
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
                      <TeamShield name={team.team} src={shieldUrl} className="w-5 h-5 sm:w-6 sm:h-6" />
                      {onTeamClick ? (
                        <Button variant="ghost" size="sm"
                          onClick={() => onTeamClick(team.team)}
                           className="block h-auto p-0 min-w-0 flex-1 truncate hover:text-primary hover:underline text-left justify-start"
                           title={team.team}
                        >
                          {team.team}
                        </Button>
                      ) : (
                         <span className="block min-w-0 flex-1 truncate" title={team.team}>
                          {team.team}
                        </span>
                      )}
                      <FollowTeamButton team={team.team} compact />
                      <Button type="button" variant="ghost" size="icon" className="standings-expand h-7 w-7 shrink-0" aria-label={`${expanded ? 'Ocultar' : 'Ver'} estadísticas de ${team.team}`} aria-expanded={expanded} onClick={() => setExpandedTeam(expanded ? null : team.team)}>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                      </Button>
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
                       {form.map((result, i) => (
                        <FormIndicator key={i} result={result} />
                      ))}
                    </div>
                  </td>
                </tr>
                {expanded && <tr className="standings-detail-row"><td colSpan={11}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-1 text-xs">
                    <span>G <strong>{team.won}</strong></span><span>E <strong>{team.drawn}</strong></span><span>P <strong>{team.lost}</strong></span>
                    <span>GF <strong>{team.goalsFor}</strong></span><span>GC <strong>{team.goalsAgainst}</strong></span>
                    <span className="flex items-center gap-1">Racha {form.map((result, i) => <FormIndicator key={i} result={result} />)}</span>
                  </div>
                </td></tr>}
                </tbody>
              );
            })}
        </table>
      </div>
    </div>
  );
}
