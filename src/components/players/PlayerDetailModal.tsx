import { X, User, Target, CreditCard, Clock, Play, Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matchday, MatchReport, MatchReportPlayer, Team } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';

interface PlayerDetailModalProps {
  playerName: string;
  teamName: string;
  matchdays: Matchday[];
  matchReports: MatchReport[];
  teams?: Team[];
  onClose: () => void;
}

interface PlayerMatchData {
  jornada: number;
  opponent: string;
  isHome: boolean;
  date: string;
  result: string;
  isStarting: boolean;
  substitutionMin: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

export function PlayerDetailModal({ 
  playerName, 
  teamName, 
  matchdays,
  matchReports,
  teams,
  onClose 
}: PlayerDetailModalProps) {
  const { getPlayerPhoto, getTeamShield } = useTeamImages();

  // Find player ID from team
  const team = teams?.find(t => t.name === teamName);
  const player = team?.players?.find(p => p.name === playerName);
  const playerId = player?.id;
  const playerPhotoUrl = playerId ? getPlayerPhoto(teamName, playerId) : undefined;
  const teamShieldUrl = getTeamShield(teamName);
  // Calculate player stats from all match reports
  const playerMatches: PlayerMatchData[] = [];
  let totalGoals = 0;
  let totalYellowCards = 0;
  let totalRedCards = 0;
  let gamesStarted = 0;
  let gamesSubstitute = 0;

  matchReports.forEach(report => {
    const teamData = report[teamName];
    if (typeof teamData === 'object' && teamData && 'players' in teamData) {
      const players = (teamData as { players: MatchReportPlayer[] }).players || [];
      const player = players.find(p => p.name === playerName);
      
      if (player) {
        // Find the match details
        const [home, away] = report.id.split('-');
        const isHome = home === teamName;
        const opponent = isHome ? away : home;

        // Find the matchday for this match
        const matchday = matchdays.find(md => 
          md.matches?.some(m => 
            (m.home === home && m.away === away) || 
            (m.home === away && m.away === home)
          )
        );

        const match = matchday?.matches?.find(m => 
          (m.home === home && m.away === away) ||
          (m.home === away && m.away === home)
        );

        if (match && matchday) {
          const ownGoals = isHome ? match.homeGoals : match.awayGoals;
          const oppGoals = isHome ? match.awayGoals : match.homeGoals;

          playerMatches.push({
            jornada: matchday.jornada,
            opponent,
            isHome,
            date: match.date,
            result: `${ownGoals}-${oppGoals}`,
            isStarting: player.isStarting,
            substitutionMin: player.substitutionMin || '',
            goals: player.goals || 0,
            yellowCards: player.yellowCards || 0,
            redCards: (player.redCards || 0) + (player.directRedCards || 0)
          });

          totalGoals += player.goals || 0;
          totalYellowCards += player.yellowCards || 0;
          totalRedCards += (player.redCards || 0) + (player.directRedCards || 0);
          
          if (player.isStarting) {
            gamesStarted++;
          } else if (player.substitutionMin) {
            gamesSubstitute++;
          }
        }
      }
    }
  });

  // Sort by jornada
  playerMatches.sort((a, b) => a.jornada - b.jornada);

  const totalGames = gamesStarted + gamesSubstitute;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 glass-card border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {playerPhotoUrl ? (
                <img
                  src={playerPhotoUrl}
                  alt={playerName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">{playerName}</h2>
                <div className="flex items-center gap-2">
                  {teamShieldUrl && (
                    <img
                      src={teamShieldUrl}
                      alt={teamName}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">{teamName}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-2xl font-bold">{totalGames}</p>
              <p className="text-[10px] text-muted-foreground">Partidos</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="flex items-center justify-center gap-1">
                <Play className="w-3 h-3 text-primary" />
                <p className="text-2xl font-bold text-primary">{gamesStarted}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Titular</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-center gap-1">
                <Armchair className="w-3 h-3 text-muted-foreground" />
                <p className="text-2xl font-bold">{gamesSubstitute}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Suplente</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <div className="flex items-center justify-center gap-1">
                <Target className="w-3 h-3 text-primary" />
                <p className="text-2xl font-bold text-primary">{totalGoals}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Goles</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <div className="flex items-center justify-center gap-1">
                <span className="w-3 h-4 bg-warning rounded-sm" />
                <p className="text-2xl font-bold text-warning">{totalYellowCards}</p>
                {totalRedCards > 0 && (
                  <>
                    <span className="w-3 h-4 bg-destructive rounded-sm ml-1" />
                    <p className="text-2xl font-bold text-destructive">{totalRedCards}</p>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Tarjetas</p>
            </div>
          </div>
        </div>

        {/* Match history */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Historial de Partidos
          </h3>

          {playerMatches.length > 0 ? (
            <div className="space-y-2">
              {playerMatches.map((match, index) => (
                <div
                  key={index}
                  className="glass-card p-3 bg-secondary/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">
                        J{match.jornada}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {match.isHome ? 'vs' : '@'} {match.opponent}
                        </p>
                        <p className="text-xs text-muted-foreground">{match.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Starting/Substitute status */}
                      <div className={cn(
                        'px-2 py-1 rounded text-[10px] font-medium',
                        match.isStarting 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-secondary text-muted-foreground'
                      )}>
                        {match.isStarting ? 'Titular' : `Sup. ${match.substitutionMin}'`}
                      </div>

                      {/* Goals */}
                      {match.goals > 0 && (
                        <div className="flex items-center gap-1 text-primary">
                          <Target className="w-3 h-3" />
                          <span className="text-sm font-bold">{match.goals}</span>
                        </div>
                      )}

                      {/* Cards */}
                      {match.yellowCards > 0 && (
                        <span className="w-3 h-4 bg-warning rounded-sm" />
                      )}
                      {match.redCards > 0 && (
                        <span className="w-3 h-4 bg-destructive rounded-sm" />
                      )}

                      {/* Result */}
                      <span className="text-sm font-bold">{match.result}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay datos de partidos para este jugador</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
