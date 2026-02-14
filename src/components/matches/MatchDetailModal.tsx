import { useState } from 'react';
import { X, User, Goal, CreditCard, ArrowRightLeft, Shield, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match, MatchReport, MatchReportPlayer, Team } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';
import { TacticalField } from './TacticalField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const getTeamFormation = (teamName: string): string => {
    if (!matchReport) return '1-4-4-2';
    const teamData = matchReport[teamName];
    if (typeof teamData === 'string' || !teamData) return '1-4-4-2';
    return (teamData as any).formation || '1-4-4-2';
  };

  const homePlayers = getTeamPlayers(match.home);
  const awayPlayers = getTeamPlayers(match.away);
  const homeFormation = getTeamFormation(match.home);
  const awayFormation = getTeamFormation(match.away);

  // Keep starters in original array order (matches the order entered in the report)
  const getStarters = (players: MatchReportPlayer[]) => 
    players.filter(p => p.isStarting);
  
  const getSubstitutes = (players: MatchReportPlayer[]) => 
    players.filter(p => !p.isStarting && p.substitutionMin);

  // Get ALL substitution pairs - each sub that entered gets its own entry
  const getSubstitutionPairs = (players: MatchReportPlayer[]): SubstitutionPair[] => {
    const starters = players.filter(p => p.isStarting && p.substitutionMin);
    const subs = players.filter(p => !p.isStarting && p.substitutionMin);
    
    const pairs: SubstitutionPair[] = [];
    const usedStarters = new Set<string>();
    
    // For each substitute that entered, create a pair with a starter that left at the same minute
    subs.forEach(subPlayer => {
      const min = subPlayer.substitutionMin!;
      // Find a starter who left at the same minute and hasn't been paired yet
      const starterOut = starters.find(s => 
        s.substitutionMin === min && !usedStarters.has(`${s.id}-${s.name}`)
      );
      
      if (starterOut) {
        usedStarters.add(`${starterOut.id}-${starterOut.name}`);
      }
      
      pairs.push({
        minute: min,
        playerIn: subPlayer,
        playerOut: starterOut
      });
    });
    
    // Add any starters that left but weren't paired (edge cases)
    starters.forEach(starter => {
      if (!usedStarters.has(`${starter.id}-${starter.name}`)) {
        pairs.push({
          minute: starter.substitutionMin!,
          playerOut: starter
        });
      }
    });
    
    // Sort by minute
    return pairs.sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
  };

  const getScorers = (players: MatchReportPlayer[]) =>
    players.filter(p => p.goals > 0 || (p.ownGoals || 0) > 0);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="glass-card w-full min-h-screen sm:min-h-0 sm:max-w-2xl sm:my-4 sm:mx-4 flex flex-col sm:max-h-[calc(100vh-2rem)] sm:rounded-xl rounded-none">
        {/* Header - always visible */}
        <div className="shrink-0 glass-card border-b border-border/50 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">
                {match.status === 'PENDING' ? 'Información del Partido' : 
                 match.status === 'LIVE' ? 'Partido en Directo' : 'Acta Digital'}
              </h2>
              {match.date && (
                <p className="text-xs text-muted-foreground truncate">{match.date} {match.time && `• ${match.time}`}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-6">
          {/* Match Result - Professional scoreboard */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-secondary/40 via-secondary/20 to-secondary/40 border border-border/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Home Team */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-secondary/50 flex items-center justify-center ring-2 ring-border/30 overflow-hidden flex-shrink-0">
                    {homeShield ? (
                      <img src={homeShield} alt={match.home} className="w-7 h-7 sm:w-12 sm:h-12 object-contain" />
                    ) : (
                      <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className={cn(
                    "font-bold text-xs sm:text-sm text-center leading-tight break-words w-full",
                    match.homeGoals > match.awayGoals && "text-primary"
                  )}>
                    {match.home}
                  </p>
                </div>
                
                {/* Score */}
                <div className="flex items-center gap-1 sm:gap-3 px-1 sm:px-6 flex-shrink-0">
                  {match.status === 'PENDING' || match.status === 'SCHEDULED' ? (
                    <div className="text-center">
                      <span className="text-muted-foreground text-lg sm:text-2xl font-medium">vs</span>
                      {match.time && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{match.time}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className={cn(
                        "w-10 h-12 sm:w-16 sm:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-4xl font-black tabular-nums",
                        match.homeGoals > match.awayGoals 
                          ? "bg-primary/20 text-primary ring-2 ring-primary/30" 
                          : "bg-secondary/50 text-foreground"
                      )}>
                        {match.homeGoals}
                      </div>
                      <span className="text-muted-foreground text-lg sm:text-2xl font-bold">:</span>
                      <div className={cn(
                        "w-10 h-12 sm:w-16 sm:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-4xl font-black tabular-nums",
                        match.awayGoals > match.homeGoals 
                          ? "bg-primary/20 text-primary ring-2 ring-primary/30" 
                          : "bg-secondary/50 text-foreground"
                      )}>
                        {match.awayGoals}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Away Team */}
                <div className="flex-1 flex flex-col items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-secondary/50 flex items-center justify-center ring-2 ring-border/30 overflow-hidden flex-shrink-0">
                    {awayShield ? (
                      <img src={awayShield} alt={match.away} className="w-7 h-7 sm:w-12 sm:h-12 object-contain" />
                    ) : (
                      <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className={cn(
                    "font-bold text-xs sm:text-sm text-center leading-tight break-words w-full",
                    match.awayGoals > match.homeGoals && "text-primary"
                  )}>
                    {match.away}
                  </p>
                </div>
              </div>
            </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      {getScorers(homePlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center gap-1 flex-wrap">
                          <span className="text-primary font-medium shrink-0">{player.goals}x</span>
                          <PlayerName player={player} teamName={match.home} className="break-words" />
                          {(player.ownGoals || 0) > 0 && (
                            <span className="text-warning text-xs font-medium">(+{player.ownGoals} pp)</span>
                          )}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1 sm:text-right">
                      {getScorers(awayPlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center sm:justify-end gap-1 flex-wrap">
                          <PlayerName player={player} teamName={match.away} className="break-words" />
                          <span className="text-primary font-medium shrink-0">{player.goals}x</span>
                          {(player.ownGoals || 0) > 0 && (
                            <span className="text-warning text-xs font-medium">(+{player.ownGoals} pp)</span>
                          )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      {getCardedPlayers(homePlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center gap-1 flex-wrap">
                          {player.yellowCards > 0 && (
                            <span className="inline-block w-3 h-4 bg-warning rounded-sm shrink-0" />
                          )}
                          {(player.redCards > 0 || player.directRedCards > 0) && (
                            <span className="inline-block w-3 h-4 bg-destructive rounded-sm shrink-0" />
                          )}
                          <PlayerName player={player} teamName={match.home} className="break-words" />
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1 sm:text-right">
                      {getCardedPlayers(awayPlayers).map((player, i) => (
                        <p key={i} className="text-sm flex items-center sm:justify-end gap-1 flex-wrap">
                          <PlayerName player={player} teamName={match.away} className="break-words" />
                          {player.yellowCards > 0 && (
                            <span className="inline-block w-3 h-4 bg-warning rounded-sm shrink-0" />
                          )}
                          {(player.redCards > 0 || player.directRedCards > 0) && (
                            <span className="inline-block w-3 h-4 bg-destructive rounded-sm shrink-0" />
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Lineups with Tactical View Tabs */}
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Alineaciones
                  </TabsTrigger>
                  <TabsTrigger value="field" className="flex items-center gap-1">
                    <Map className="w-4 h-4" />
                    Campo Táctico
                  </TabsTrigger>
                </TabsList>

                {/* List View */}
                <TabsContent value="list" className="m-0">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                    {/* Home team */}
                    <div className="glass-card p-4 bg-secondary/20">
                      <h3 className="flex items-center gap-2 font-semibold mb-3 pb-2 border-b border-border/30">
                        <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden">
                          {homeShield ? (
                            <img src={homeShield} alt={match.home} className="w-6 h-6 object-contain" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{match.home}</span>
                      </h3>
                      
                      {getStarters(homePlayers).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Titulares</p>
                          <div className="space-y-1">
                            {getStarters(homePlayers).map((player, i) => (
                              <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                  {player.matchNumber}
                                </span>
                                <PlayerName player={player} teamName={match.home} className="text-sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {homeSubPairs.length > 0 && (
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" />
                            Cambios
                          </p>
                          <div className="space-y-2">
                            {homeSubPairs.map((pair, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm bg-secondary/20 rounded-lg p-2">
                                {pair.playerIn && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <span className="text-xs">↑</span>
                                    <span className="w-5 h-5 rounded-full bg-primary/20 text-[10px] font-bold flex items-center justify-center">
                                      {pair.playerIn.matchNumber}
                                    </span>
                                    <PlayerName player={pair.playerIn} teamName={match.home} className="text-foreground" />
                                  </span>
                                )}
                                <span className="text-muted-foreground text-xs">({pair.minute}')</span>
                                {pair.playerOut && (
                                  <span className="flex items-center gap-1 text-muted-foreground ml-auto">
                                    <span className="text-xs">↓</span>
                                    <PlayerName player={pair.playerOut} teamName={match.home} />
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
                      <h3 className="flex items-center gap-2 font-semibold mb-3 pb-2 border-b border-border/30">
                        <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden">
                          {awayShield ? (
                            <img src={awayShield} alt={match.away} className="w-6 h-6 object-contain" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{match.away}</span>
                      </h3>
                      
                      {getStarters(awayPlayers).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Titulares</p>
                          <div className="space-y-1">
                            {getStarters(awayPlayers).map((player, i) => (
                              <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                  {player.matchNumber}
                                </span>
                                <PlayerName player={player} teamName={match.away} className="text-sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {awaySubPairs.length > 0 && (
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" />
                            Cambios
                          </p>
                          <div className="space-y-2">
                            {awaySubPairs.map((pair, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm bg-secondary/20 rounded-lg p-2">
                                {pair.playerIn && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <span className="text-xs">↑</span>
                                    <span className="w-5 h-5 rounded-full bg-primary/20 text-[10px] font-bold flex items-center justify-center">
                                      {pair.playerIn.matchNumber}
                                    </span>
                                    <PlayerName player={pair.playerIn} teamName={match.away} className="text-foreground" />
                                  </span>
                                )}
                                <span className="text-muted-foreground text-xs">({pair.minute}')</span>
                                {pair.playerOut && (
                                  <span className="flex items-center gap-1 text-muted-foreground ml-auto">
                                    <span className="text-xs">↓</span>
                                    <PlayerName player={pair.playerOut} teamName={match.away} />
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Field View */}
                <TabsContent value="field" className="m-0">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        {homeShield ? (
                          <img src={homeShield} alt={match.home} className="w-6 h-6 object-contain" />
                        ) : (
                          <Shield className="w-5 h-5 text-muted-foreground" />
                        )}
                        {match.home}
                      </h3>
                      <TacticalField
                        teamName={match.home}
                        formation={homeFormation}
                        players={homePlayers}
                        homeTeamPlayers={homeTeam?.players}
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 font-semibold text-sm">
                        {awayShield ? (
                          <img src={awayShield} alt={match.away} className="w-6 h-6 object-contain" />
                        ) : (
                          <Shield className="w-5 h-5 text-muted-foreground" />
                        )}
                        {match.away}
                      </h3>
                      <TacticalField
                        teamName={match.away}
                        formation={awayFormation}
                        players={awayPlayers}
                        homeTeamPlayers={awayTeam?.players}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

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
