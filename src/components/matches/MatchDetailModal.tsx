import { useState } from 'react';
import { X, User, Goal, CreditCard, ArrowRightLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match, MatchReport, MatchReportPlayer, Team } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';

interface MatchDetailModalProps {
  match: Match;
  matchReport: MatchReport | null;
  teams?: Team[];
  onClose: () => void;
  onPlayerClick?: (playerName: string, teamName: string) => void;
}

interface SubstitutionPair {
  minute: string;
  playerIn?: MatchReportPlayer;
  playerOut?: MatchReportPlayer;
}

export function MatchDetailModal({ match, matchReport, teams, onClose, onPlayerClick }: MatchDetailModalProps) {
  const { getTeamShield, getPlayerPhoto } = useTeamImages();
  
  const homeShield = getTeamShield(match.home);
  const awayShield = getTeamShield(match.away);
  
  const homeTeam = teams?.find(t => t.name === match.home);
  const awayTeam = teams?.find(t => t.name === match.away);

  const getTeamPlayers = (teamName: string): MatchReportPlayer[] => {
    if (!matchReport) return [];
    const teamData = matchReport[teamName];
    if (typeof teamData === 'string' || !teamData) return [];
    return (teamData as { players: MatchReportPlayer[] }).players || [];
  };

  const homePlayers = getTeamPlayers(match.home);
  const awayPlayers = getTeamPlayers(match.away);

  // Sort starters by matchNumber
  const getStarters = (players: MatchReportPlayer[]) => 
    players.filter(p => p.isStarting).sort((a, b) => {
      const numA = typeof a.matchNumber === 'number' ? a.matchNumber : parseInt(String(a.matchNumber)) || 0;
      const numB = typeof b.matchNumber === 'number' ? b.matchNumber : parseInt(String(b.matchNumber)) || 0;
      return numA - numB;
    });
  
  const getSubstitutes = (players: MatchReportPlayer[]) => 
    players.filter(p => !p.isStarting && p.substitutionMin);

  // Get substitution pairs grouped by minute
  const getSubstitutionPairs = (players: MatchReportPlayer[]): SubstitutionPair[] => {
    const starters = players.filter(p => p.isStarting && p.substitutionMin);
    const subs = players.filter(p => !p.isStarting && p.substitutionMin);
    
    // Group by minute
    const minuteMap = new Map<string, SubstitutionPair>();
    
    // Add players going out (starters with substitutionMin = minute they left)
    starters.forEach(player => {
      const min = player.substitutionMin!;
      if (!minuteMap.has(min)) {
        minuteMap.set(min, { minute: min });
      }
      const pair = minuteMap.get(min)!;
      if (!pair.playerOut) {
        pair.playerOut = player;
      }
    });
    
    // Add players coming in (subs with substitutionMin = minute they entered)
    subs.forEach(player => {
      const min = player.substitutionMin!;
      if (!minuteMap.has(min)) {
        minuteMap.set(min, { minute: min });
      }
      const pair = minuteMap.get(min)!;
      if (!pair.playerIn) {
        pair.playerIn = player;
      }
    });
    
    // Sort by minute
    return Array.from(minuteMap.values()).sort((a, b) => 
      parseInt(a.minute) - parseInt(b.minute)
    );
  };

  const getScorers = (players: MatchReportPlayer[]) =>
    players.filter(p => p.goals > 0);

  const getCardedPlayers = (players: MatchReportPlayer[]) =>
    players.filter(p => p.yellowCards > 0 || p.redCards > 0 || p.directRedCards > 0);

  const getPlayerId = (playerName: string, teamName: string): string | number | undefined => {
    const team = teamName === match.home ? homeTeam : awayTeam;
    const player = team?.players?.find(p => p.name === playerName);
    return player?.id;
  };

  const PlayerName = ({ player, teamName, className }: { player: MatchReportPlayer; teamName: string; className?: string }) => {
    const playerId = getPlayerId(player.name, teamName);
    const photoUrl = playerId ? getPlayerPhoto(teamName, playerId) : undefined;
    
    if (onPlayerClick) {
      return (
        <button
          onClick={() => onPlayerClick(player.name, teamName)}
          className={cn("hover:text-primary hover:underline transition-colors text-left inline-flex items-center gap-1", className)}
        >
          {photoUrl && (
            <img src={photoUrl} alt={player.name} className="w-5 h-5 rounded-full object-cover" />
          )}
          {player.alias || player.name}
        </button>
      );
    }
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        {photoUrl && (
          <img src={photoUrl} alt={player.name} className="w-5 h-5 rounded-full object-cover" />
        )}
        {player.alias || player.name}
      </span>
    );
  };

  const homeSubPairs = getSubstitutionPairs(homePlayers);
  const awaySubPairs = getSubstitutionPairs(awayPlayers);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {match.status === 'PENDING' ? 'Información del Partido' : 
             match.status === 'LIVE' ? 'Partido en Directo' : 'Acta del Partido'}
          </h2>
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
              <div className="flex-1 text-right flex items-center justify-end gap-2">
                {homeShield ? (
                  <img src={homeShield} alt={match.home} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <p className={cn(
                  "font-semibold",
                  match.homeGoals > match.awayGoals && "text-primary"
                )}>
                  {match.home}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4">
                {match.status === 'PENDING' ? (
                  <span className="text-muted-foreground text-xl">vs</span>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div className="flex-1 text-left flex items-center gap-2">
                <p className={cn(
                  "font-semibold",
                  match.awayGoals > match.homeGoals && "text-primary"
                )}>
                  {match.away}
                </p>
                {awayShield ? (
                  <img src={awayShield} alt={match.away} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
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
              <p className="text-muted-foreground">
                {match.status === 'PENDING' 
                  ? 'Partido pendiente de disputarse. Para editar horarios, alineaciones y resultados, accede desde el panel de administración.'
                  : 'No hay acta disponible para este partido'}
              </p>
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
                        <p key={i} className="text-sm flex items-center gap-1">
                          <span className="text-primary font-medium">{player.goals}x</span>
                          <PlayerName player={player} teamName={match.home} />
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1 text-right">
                      {getScorers(awayPlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center justify-end gap-1">
                          <PlayerName player={player} teamName={match.away} />
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
                          <PlayerName player={player} teamName={match.home} />
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1 text-right">
                      {getCardedPlayers(awayPlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center justify-end gap-1">
                          <PlayerName player={player} teamName={match.away} />
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
                    {homeShield ? (
                      <img src={homeShield} alt={match.home} className="w-5 h-5 object-contain" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                    {match.home}
                  </h3>
                  
                  {getStarters(homePlayers).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Titulares</p>
                      <div className="space-y-0.5">
                        {getStarters(homePlayers).map((player, i) => (
                          <p key={i} className="text-sm flex items-center gap-1">
                            <span className="text-muted-foreground text-xs mr-1">#{player.matchNumber}</span>
                            <PlayerName player={player} teamName={match.home} />
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {homeSubPairs.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        Cambios
                      </p>
                      <div className="space-y-1">
                        {homeSubPairs.map((pair, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            {pair.playerIn && (
                              <span className="text-foreground">
                                <span className="text-xs mr-1">#{pair.playerIn.matchNumber}</span>
                                <PlayerName player={pair.playerIn} teamName={match.home} />
                                <span className="text-xs ml-1">({pair.minute}')</span>
                              </span>
                            )}
                            {pair.playerIn && pair.playerOut && (
                              <span className="mx-1 text-muted-foreground">/</span>
                            )}
                            {pair.playerOut && (
                              <span className="text-muted-foreground">
                                Sale <PlayerName player={pair.playerOut} teamName={match.home} className="text-muted-foreground" />
                                <span className="text-xs ml-1">({pair.minute}')</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Away team */}
                <div className="glass-card p-4 bg-secondary/20">
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                    {awayShield ? (
                      <img src={awayShield} alt={match.away} className="w-5 h-5 object-contain" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                    {match.away}
                  </h3>
                  
                  {getStarters(awayPlayers).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Titulares</p>
                      <div className="space-y-0.5">
                        {getStarters(awayPlayers).map((player, i) => (
                          <p key={i} className="text-sm flex items-center gap-1">
                            <span className="text-muted-foreground text-xs mr-1">#{player.matchNumber}</span>
                            <PlayerName player={player} teamName={match.away} />
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {awaySubPairs.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        Cambios
                      </p>
                      <div className="space-y-1">
                        {awaySubPairs.map((pair, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            {pair.playerIn && (
                              <span className="text-foreground">
                                <span className="text-xs mr-1">#{pair.playerIn.matchNumber}</span>
                                <PlayerName player={pair.playerIn} teamName={match.away} />
                                <span className="text-xs ml-1">({pair.minute}')</span>
                              </span>
                            )}
                            {pair.playerIn && pair.playerOut && (
                              <span className="mx-1 text-muted-foreground">/</span>
                            )}
                            {pair.playerOut && (
                              <span className="text-muted-foreground">
                                Sale <PlayerName player={pair.playerOut} teamName={match.away} className="text-muted-foreground" />
                                <span className="text-xs ml-1">({pair.minute}')</span>
                              </span>
                            )}
                          </div>
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
