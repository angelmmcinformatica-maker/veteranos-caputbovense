import { useState } from 'react';
import { X, FileText, Users, Goal, CreditCard, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matchday, MatchReport, MatchReportPlayer } from '@/types/league';

interface AdminReportsViewProps {
  matchdays: Matchday[];
  matchReports: MatchReport[];
  onClose: () => void;
}

export function AdminReportsView({ matchdays, matchReports, onClose }: AdminReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<MatchReport | null>(null);

  const getMatchDetails = (reportId: string) => {
    const [home, away] = reportId.split('-');
    
    for (const md of matchdays) {
      const match = md.matches?.find(m => 
        m.home === home && m.away === away
      );
      if (match) {
        return { match, jornada: md.jornada };
      }
    }
    return null;
  };

  const getTeamPlayers = (report: MatchReport, teamName: string): MatchReportPlayer[] => {
    const teamData = report[teamName];
    if (typeof teamData === 'string' || !teamData) return [];
    return (teamData as { players: MatchReportPlayer[] }).players || [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full h-full max-w-none rounded-none overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Actas Digitales</h2>
            <p className="text-sm text-muted-foreground">{matchReports.length} actas registradas</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reports list or detail */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedReport ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="text-sm text-primary hover:underline"
              >
                ← Volver a la lista
              </button>

              {(() => {
                const details = getMatchDetails(selectedReport.id);
                const [home, away] = selectedReport.id.split('-');
                const homePlayers = getTeamPlayers(selectedReport, home);
                const awayPlayers = getTeamPlayers(selectedReport, away);

                return (
                  <div className="space-y-4">
                    {/* Match header */}
                    <div className="glass-card p-4 bg-secondary/30">
                      <div className="flex items-center justify-center gap-4">
                        <span className="font-semibold text-right flex-1">{home}</span>
                        <span className="text-2xl font-bold text-primary">
                          {details?.match.homeGoals} - {details?.match.awayGoals}
                        </span>
                        <span className="font-semibold text-left flex-1">{away}</span>
                      </div>
                      {details && (
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          Jornada {details.jornada} • {details.match.date}
                        </p>
                      )}
                    </div>

                    {/* Teams lineups */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[{ name: home, players: homePlayers }, { name: away, players: awayPlayers }].map(team => (
                        <div key={team.name} className="glass-card p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            {team.name}
                          </h3>
                          
                          <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {team.players.map((player, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  'flex items-center justify-between p-2 rounded',
                                  player.isStarting ? 'bg-primary/10' : 'bg-secondary/30'
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-6">
                                    #{player.matchNumber}
                                  </span>
                                  <span className="text-sm">
                                    {player.alias || player.name}
                                  </span>
                                  {!player.isStarting && player.substitutionMin && (
                                    <span className="text-xs text-muted-foreground">
                                      ({player.substitutionMin}')
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {player.goals > 0 && (
                                    <span className="flex items-center gap-1 text-primary text-xs">
                                      <Goal className="w-3 h-3" />
                                      {player.goals}
                                    </span>
                                  )}
                                  {player.yellowCards > 0 && (
                                    <span className="w-3 h-4 bg-warning rounded-sm" />
                                  )}
                                  {(player.redCards > 0 || player.directRedCards > 0) && (
                                    <span className="w-3 h-4 bg-destructive rounded-sm" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Observations */}
                    {selectedReport.observations && typeof selectedReport.observations === 'string' && (
                      <div className="glass-card p-4">
                        <h3 className="font-semibold mb-2">Observaciones</h3>
                        <p className="text-sm text-muted-foreground">{selectedReport.observations}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              {matchReports.map((report) => {
                const details = getMatchDetails(report.id);
                const [home, away] = report.id.split('-');
                const homePlayers = getTeamPlayers(report, home);
                const awayPlayers = getTeamPlayers(report, away);
                const totalGoals = [...homePlayers, ...awayPlayers].reduce((acc, p) => acc + (p.goals || 0), 0);
                const totalCards = [...homePlayers, ...awayPlayers].reduce((acc, p) => 
                  acc + (p.yellowCards || 0) + (p.redCards || 0) + (p.directRedCards || 0), 0);

                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="w-full glass-card p-4 text-left hover:ring-1 hover:ring-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {home} vs {away}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {details && (
                              <>
                                <Calendar className="w-3 h-3" />
                                Jornada {details.jornada}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {details && (
                          <span className="font-bold text-lg">
                            {details.match.homeGoals} - {details.match.awayGoals}
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Goal className="w-3 h-3" />
                            {totalGoals}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {totalCards}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {matchReports.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay actas registradas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
