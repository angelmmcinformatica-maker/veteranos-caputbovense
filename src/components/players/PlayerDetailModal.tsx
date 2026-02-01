import { X, User, Target, CreditCard, Clock, Play, Armchair, Home, Car, Shield } from 'lucide-react';
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
  minutesPlayed: number;
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

  // Find player ID from team - search by name or alias
  const team = teams?.find(t => t.name === teamName);
  const player = team?.players?.find(p => 
    p.name === playerName || p.alias === playerName
  );
  const playerId = player?.id;
  const playerPhotoUrl = playerId !== undefined ? getPlayerPhoto(teamName, playerId) : undefined;
  const teamShieldUrl = getTeamShield(teamName);
  // Calculate player stats from all match reports
  const playerMatches: PlayerMatchData[] = [];
  let totalGoals = 0;
  let totalYellowCards = 0;
  let totalRedCards = 0;
  let gamesStarted = 0;
  let gamesSubstitute = 0;
  let totalMinutes = 0;

  // Helper to calculate minutes played
  const calculateMinutes = (isStarting: boolean, substitutionMin: string): number => {
    const subMin = parseInt(substitutionMin) || 0;
    if (isStarting) {
      // Starter: if substituted out, played until that minute; otherwise full 90
      return subMin > 0 ? subMin : 90;
    } else {
      // Substitute: entered at substitutionMin, played until 90
      return subMin > 0 ? (90 - subMin) : 0;
    }
  };

  matchReports.forEach(report => {
    const teamData = report[teamName];
    if (typeof teamData === 'object' && teamData && 'players' in teamData) {
      const players = (teamData as { players: MatchReportPlayer[] }).players || [];
      // Search by name OR alias
      const foundPlayer = players.find(p => 
        p.name === playerName || 
        p.alias === playerName ||
        (player && (p.name === player.name || p.alias === player.alias))
      );
      
      if (foundPlayer) {
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
          const minutes = calculateMinutes(foundPlayer.isStarting, foundPlayer.substitutionMin || '');

          playerMatches.push({
            jornada: matchday.jornada,
            opponent,
            isHome,
            date: match.date,
            result: `${ownGoals}-${oppGoals}`,
            isStarting: foundPlayer.isStarting,
            substitutionMin: foundPlayer.substitutionMin || '',
            goals: foundPlayer.goals || 0,
            yellowCards: foundPlayer.yellowCards || 0,
            redCards: (foundPlayer.redCards || 0) + (foundPlayer.directRedCards || 0),
            minutesPlayed: minutes
          });

          totalGoals += foundPlayer.goals || 0;
          totalYellowCards += foundPlayer.yellowCards || 0;
          totalRedCards += (foundPlayer.redCards || 0) + (foundPlayer.directRedCards || 0);
          totalMinutes += minutes;
          
          if (foundPlayer.isStarting) {
            gamesStarted++;
          } else if (foundPlayer.substitutionMin) {
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
          <div className="grid grid-cols-6 gap-2 mt-4">
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
            <div className="text-center p-3 rounded-lg bg-accent/10">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-accent-foreground" />
                <p className="text-2xl font-bold">{totalMinutes}'</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Minutos</p>
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
              {playerMatches.map((match, index) => {
                const opponentShield = getTeamShield(match.opponent);
                return (
                  <div
                    key={index}
                    className="glass-card p-2 sm:p-3 bg-secondary/20"
                  >
                    <div className="flex items-center gap-2">
                      {/* Left section: Jornada + Home/Away + Shield */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] sm:text-xs font-bold">
                          J{match.jornada}
                        </div>
                        <div className={cn(
                          'w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center',
                          match.isHome ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                        )}>
                          {match.isHome ? <Home className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                        </div>
                        {opponentShield ? (
                          <img src={opponentShield} alt={match.opponent} className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Center: Opponent name - flexible with truncation */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{match.opponent}</p>
                        <p className="text-[10px] text-muted-foreground">{match.date}</p>
                      </div>

                      {/* Right section: Stats + Result - compact for mobile */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {/* Minutes played - hidden on very small screens */}
                        <div className="hidden xs:block text-[10px] sm:text-xs text-muted-foreground">
                          {match.minutesPlayed}'
                        </div>

                        {/* Starting/Substitute status - abbreviated on mobile */}
                        <div className={cn(
                          'px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-medium whitespace-nowrap',
                          match.isStarting 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-secondary text-muted-foreground'
                        )}>
                          {match.isStarting ? 'TIT' : `${match.substitutionMin}'`}
                        </div>

                        {/* Goals */}
                        {match.goals > 0 && (
                          <div className="flex items-center gap-0.5 text-primary">
                            <Target className="w-3 h-3" />
                            <span className="text-xs font-bold">{match.goals}</span>
                          </div>
                        )}

                        {/* Cards - smaller on mobile */}
                        {match.yellowCards > 0 && (
                          <span className="w-2 h-3 sm:w-3 sm:h-4 bg-warning rounded-sm flex-shrink-0" />
                        )}
                        {match.redCards > 0 && (
                          <span className="w-2 h-3 sm:w-3 sm:h-4 bg-destructive rounded-sm flex-shrink-0" />
                        )}

                        {/* Result - priority, fixed width */}
                        <span className="text-xs sm:text-sm font-bold whitespace-nowrap tabular-nums min-w-[28px] text-right">
                          {match.result}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
