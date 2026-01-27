import { X, User, Goal, CreditCard, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match, MatchReport, MatchReportPlayer } from '@/types/league';

interface MatchDetailModalProps {
  match: Match;
  matchReport: MatchReport | null;
  onClose: () => void;
}

export function MatchDetailModal({ match, matchReport, onClose }: MatchDetailModalProps) {
  const getTeamPlayers = (teamName: string): MatchReportPlayer[] => {
    if (!matchReport) return [];
    const teamData = matchReport[teamName];
    if (typeof teamData === 'string' || !teamData) return [];
    return (teamData as { players: MatchReportPlayer[] }).players || [];
  };

  const homePlayers = getTeamPlayers(match.home);
  const awayPlayers = getTeamPlayers(match.away);

  const getStarters = (players: MatchReportPlayer[]) => 
    players.filter(p => p.isStarting);
  
  const getSubstitutes = (players: MatchReportPlayer[]) => 
    players.filter(p => !p.isStarting && p.substitutionMin);

  const getScorers = (players: MatchReportPlayer[]) =>
    players.filter(p => p.goals > 0);

  const getCardedPlayers = (players: MatchReportPlayer[]) =>
    players.filter(p => p.yellowCards > 0 || p.redCards > 0 || p.directRedCards > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Acta del Partido</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Match Result */}
          <div className="glass-card p-4 bg-secondary/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-right">
                <p className={cn(
                  "font-semibold",
                  match.homeGoals > match.awayGoals && "text-primary"
                )}>
                  {match.home}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4">
                <span className={cn(
                  "text-3xl font-bold tabular-nums",
                  match.homeGoals > match.awayGoals && "text-primary"
                )}>
                  {match.homeGoals}
                </span>
                <span className="text-muted-foreground text-xl">-</span>
                <span className={cn(
                  "text-3xl font-bold tabular-nums",
                  match.awayGoals > match.homeGoals && "text-primary"
                )}>
                  {match.awayGoals}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "font-semibold",
                  match.awayGoals > match.homeGoals && "text-primary"
                )}>
                  {match.away}
                </p>
              </div>
            </div>
            {match.date && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                {match.date} {match.time && `• ${match.time}`}
              </p>
            )}
          </div>

          {!matchReport ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay acta disponible para este partido</p>
            </div>
          ) : (
            <>
              {/* Scorers */}
              {(getScorers(homePlayers).length > 0 || getScorers(awayPlayers).length > 0) && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <Goal className="w-4 h-4 text-primary" />
                    Goleadores
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      {getScorers(homePlayers).map((player, i) => (
                        <p key={i} className="text-sm">
                          <span className="text-primary font-medium">{player.goals}x</span>{' '}
                          {player.alias || player.name}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1 text-right">
                      {getScorers(awayPlayers).map((player, i) => (
                        <p key={i} className="text-sm">
                          {player.alias || player.name}{' '}
                          <span className="text-primary font-medium">{player.goals}x</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Cards */}
              {(getCardedPlayers(homePlayers).length > 0 || getCardedPlayers(awayPlayers).length > 0) && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <CreditCard className="w-4 h-4 text-warning" />
                    Tarjetas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      {getCardedPlayers(homePlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center gap-1">
                          {player.yellowCards > 0 && (
                            <span className="inline-block w-3 h-4 bg-warning rounded-sm" />
                          )}
                          {(player.redCards > 0 || player.directRedCards > 0) && (
                            <span className="inline-block w-3 h-4 bg-destructive rounded-sm" />
                          )}
                          {player.alias || player.name}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1 text-right">
                      {getCardedPlayers(awayPlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center justify-end gap-1">
                          {player.alias || player.name}
                          {player.yellowCards > 0 && (
                            <span className="inline-block w-3 h-4 bg-warning rounded-sm" />
                          )}
                          {(player.redCards > 0 || player.directRedCards > 0) && (
                            <span className="inline-block w-3 h-4 bg-destructive rounded-sm" />
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lineups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home team */}
                <div className="glass-card p-4 bg-secondary/20">
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <User className="w-4 h-4 text-primary" />
                    {match.home}
                  </h3>
                  
                  {getStarters(homePlayers).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Titulares</p>
                      <div className="space-y-0.5">
                        {getStarters(homePlayers).map((player, i) => (
                          <p key={i} className="text-sm">
                            <span className="text-muted-foreground text-xs mr-1">#{player.matchNumber}</span>
                            {player.alias || player.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {getSubstitutes(homePlayers).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        Cambios
                      </p>
                      <div className="space-y-0.5">
                        {getSubstitutes(homePlayers).map((player, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            <span className="text-xs mr-1">#{player.matchNumber}</span>
                            {player.alias || player.name}
                            <span className="text-xs ml-1">({player.substitutionMin}')</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Away team */}
                <div className="glass-card p-4 bg-secondary/20">
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <User className="w-4 h-4 text-primary" />
                    {match.away}
                  </h3>
                  
                  {getStarters(awayPlayers).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Titulares</p>
                      <div className="space-y-0.5">
                        {getStarters(awayPlayers).map((player, i) => (
                          <p key={i} className="text-sm">
                            <span className="text-muted-foreground text-xs mr-1">#{player.matchNumber}</span>
                            {player.alias || player.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {getSubstitutes(awayPlayers).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        Cambios
                      </p>
                      <div className="space-y-0.5">
                        {getSubstitutes(awayPlayers).map((player, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            <span className="text-xs mr-1">#{player.matchNumber}</span>
                            {player.alias || player.name}
                            <span className="text-xs ml-1">({player.substitutionMin}')</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Observations */}
              {matchReport.observations && typeof matchReport.observations === 'string' && matchReport.observations.trim() && (
                <div className="glass-card p-4 bg-secondary/20">
                  <h3 className="text-sm font-semibold mb-2">Observaciones</h3>
                  <p className="text-sm text-muted-foreground">{matchReport.observations}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
