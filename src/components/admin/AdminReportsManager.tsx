import { useState } from 'react';
import { X, FileText, Users, Goal, CreditCard, Calendar, Trash2, AlertTriangle, Loader2, Search } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Matchday, MatchReport, MatchReportPlayer, TopScorer, CardRanking } from '@/types/league';

interface AdminReportsManagerProps {
  matchdays: Matchday[];
  matchReports: MatchReport[];
  topScorers: TopScorer[];
  cardRankings: CardRanking[];
  onClose: () => void;
  onDataChange: () => void;
}

interface ReportStats {
  report: MatchReport;
  homeTeam: string;
  awayTeam: string;
  homePlayers: MatchReportPlayer[];
  awayPlayers: MatchReportPlayer[];
  totalGoals: number;
  totalCards: number;
  jornada: number | null;
  matchDate: string | null;
  matchResult: { home: number; away: number } | null;
}

export function AdminReportsManager({ 
  matchdays, 
  matchReports, 
  topScorers, 
  cardRankings, 
  onClose, 
  onDataChange 
}: AdminReportsManagerProps) {
  const [selectedReport, setSelectedReport] = useState<ReportStats | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'reports' | 'scorers' | 'cards'>('reports');

  const getReportStats = (report: MatchReport): ReportStats => {
    const [home, away] = report.id.split('-');
    
    const getTeamPlayers = (teamName: string): MatchReportPlayer[] => {
      const teamData = report[teamName];
      if (typeof teamData === 'string' || !teamData) return [];
      return (teamData as { players: MatchReportPlayer[] }).players || [];
    };

    const homePlayers = getTeamPlayers(home);
    const awayPlayers = getTeamPlayers(away);
    
    let jornada: number | null = null;
    let matchDate: string | null = null;
    let matchResult: { home: number; away: number } | null = null;

    for (const md of matchdays) {
      const match = md.matches?.find(m => m.home === home && m.away === away);
      if (match) {
        jornada = md.jornada;
        matchDate = match.date;
        matchResult = { home: match.homeGoals, away: match.awayGoals };
        break;
      }
    }

    const totalGoals = [...homePlayers, ...awayPlayers].reduce((acc, p) => acc + (p.goals || 0), 0);
    const totalCards = [...homePlayers, ...awayPlayers].reduce((acc, p) => 
      acc + (p.yellowCards || 0) + (p.redCards || 0) + (p.directRedCards || 0), 0);

    return {
      report,
      homeTeam: home,
      awayTeam: away,
      homePlayers,
      awayPlayers,
      totalGoals,
      totalCards,
      jornada,
      matchDate,
      matchResult
    };
  };

  const reportStats = matchReports.map(getReportStats);

  const filteredReports = reportStats.filter(r => 
    r.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.jornada && `jornada ${r.jornada}`.includes(searchTerm.toLowerCase()))
  );

  const handleDeleteReport = async (reportId: string) => {
    try {
      setDeleting(reportId);
      await deleteDoc(doc(db, 'match_reports', reportId));
      toast.success('Acta eliminada correctamente');
      onDataChange();
      setConfirmDelete(null);
      if (selectedReport?.report.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el acta');
    } finally {
      setDeleting(null);
    }
  };

  // Find players with potential duplicates or issues
  const getPlayerIssues = () => {
    const playerGoals: Record<string, { total: number; reports: string[] }> = {};
    
    matchReports.forEach(report => {
      Object.entries(report).forEach(([key, value]) => {
        if (key === 'id' || key === 'observations' || typeof value === 'string') return;
        
        const teamData = value as { players: MatchReportPlayer[] };
        const teamName = key;

        teamData.players?.forEach(player => {
          if (player.goals > 0) {
            const playerId = `${player.name}-${teamName}`;
            if (!playerGoals[playerId]) {
              playerGoals[playerId] = { total: 0, reports: [] };
            }
            playerGoals[playerId].total += player.goals;
            playerGoals[playerId].reports.push(report.id);
          }
        });
      });
    });

    // Compare with topScorers to find discrepancies
    return topScorers.map(scorer => {
      const playerId = `${scorer.name}-${scorer.team}`;
      const reportData = playerGoals[playerId];
      return {
        ...scorer,
        calculatedGoals: reportData?.total || 0,
        reportCount: reportData?.reports.length || 0,
        reports: reportData?.reports || [],
        hasDiscrepancy: false // In this case, topScorers is calculated from same data
      };
    });
  };

  const playersWithStats = getPlayerIssues();

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full h-full max-w-none rounded-none overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">Gestión de Actas y Estadísticas</h2>
              <p className="text-sm text-muted-foreground">
                {matchReports.length} actas • {topScorers.length} goleadores • {cardRankings.length} con tarjetas
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setViewMode('reports')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                viewMode === 'reports'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="w-4 h-4" />
              Actas ({matchReports.length})
            </button>
            <button
              onClick={() => setViewMode('scorers')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                viewMode === 'scorers'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <Goal className="w-4 h-4" />
              Goleadores ({topScorers.length})
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                viewMode === 'cards'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <CreditCard className="w-4 h-4" />
              Tarjetas ({cardRankings.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por equipo o jornada..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'reports' && (
            <>
              {selectedReport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-sm text-primary hover:underline"
                    >
                      ← Volver a la lista
                    </button>
                    <button
                      onClick={() => setConfirmDelete(selectedReport.report.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar acta
                    </button>
                  </div>

                  {/* Match header */}
                  <div className="glass-card p-4 bg-secondary/30">
                    <div className="flex items-center justify-center gap-4">
                      <span className="font-semibold text-right flex-1">{selectedReport.homeTeam}</span>
                      <span className="text-2xl font-bold text-primary">
                        {selectedReport.matchResult?.home ?? '?'} - {selectedReport.matchResult?.away ?? '?'}
                      </span>
                      <span className="font-semibold text-left flex-1">{selectedReport.awayTeam}</span>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      {selectedReport.jornada ? `Jornada ${selectedReport.jornada}` : 'Sin jornada'} • {selectedReport.matchDate || 'Sin fecha'}
                    </p>
                    <div className="flex justify-center gap-6 mt-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Goal className="w-4 h-4 text-primary" />
                        {selectedReport.totalGoals} goles en acta
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4 text-warning" />
                        {selectedReport.totalCards} tarjetas
                      </span>
                    </div>
                  </div>

                  {/* Teams lineups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: selectedReport.homeTeam, players: selectedReport.homePlayers },
                      { name: selectedReport.awayTeam, players: selectedReport.awayPlayers }
                    ].map(team => (
                      <div key={team.name} className="glass-card p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {team.name}
                          <span className="text-xs text-muted-foreground">({team.players.length} jugadores)</span>
                        </h3>
                        
                        <div className="space-y-1 max-h-[400px] overflow-y-auto">
                          {team.players.map((player, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                'flex items-center justify-between p-2 rounded text-sm',
                                player.isStarting ? 'bg-primary/10' : 'bg-secondary/30'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-6">
                                  #{player.matchNumber}
                                </span>
                                <span>
                                  {player.alias || player.name}
                                </span>
                                {!player.isStarting && (
                                  <span className="text-xs text-muted-foreground">
                                    (Suplente{player.substitutionMin ? ` ${player.substitutionMin}'` : ''})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {player.goals > 0 && (
                                  <span className="flex items-center gap-1 text-primary text-xs font-medium">
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
                          {team.players.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Sin jugadores registrados
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observations */}
                  {selectedReport.report.observations && typeof selectedReport.report.observations === 'string' && (
                    <div className="glass-card p-4">
                      <h3 className="font-semibold mb-2">Observaciones</h3>
                      <p className="text-sm text-muted-foreground">{selectedReport.report.observations}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredReports.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No se encontraron actas' : 'No hay actas registradas'}
                      </p>
                    </div>
                  ) : (
                    filteredReports.map((stats) => (
                      <div
                        key={stats.report.id}
                        className="glass-card p-4 hover:ring-1 hover:ring-primary/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedReport(stats)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {stats.homeTeam} vs {stats.awayTeam}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                {stats.jornada ? (
                                  <>
                                    <Calendar className="w-3 h-3" />
                                    Jornada {stats.jornada}
                                  </>
                                ) : (
                                  <span className="text-warning flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Sin jornada asociada
                                  </span>
                                )}
                              </p>
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-3">
                            {stats.matchResult && (
                              <span className="font-bold text-lg">
                                {stats.matchResult.home} - {stats.matchResult.away}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Goal className="w-3 h-3" />
                                {stats.totalGoals}
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {stats.totalCards}
                              </span>
                            </div>
                            <button
                              onClick={() => setConfirmDelete(stats.report.id)}
                              className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center justify-center"
                              title="Eliminar acta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {viewMode === 'scorers' && (
            <div className="space-y-2">
              <div className="glass-card p-3 bg-blue-500/10 border border-blue-500/20 mb-4">
                <p className="text-sm text-blue-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Los goles se calculan sumando todas las actas. Si un jugador aparece con más goles de los que debería, revisa las actas donde aparece.
                </p>
              </div>
              
              {playersWithStats.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.team.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((player, index) => (
                <div key={`${player.name}-${player.team}`} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        index === 0 && 'bg-yellow-500/20 text-yellow-400',
                        index === 1 && 'bg-gray-400/20 text-gray-300',
                        index === 2 && 'bg-orange-700/20 text-orange-500',
                        index > 2 && 'bg-secondary text-muted-foreground'
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.team}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{player.goals}</p>
                        <p className="text-xs text-muted-foreground">goles totales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{player.reportCount}</p>
                        <p className="text-xs text-muted-foreground">actas</p>
                      </div>
                    </div>
                  </div>
                  {player.reports.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Actas con goles:</p>
                      <div className="flex flex-wrap gap-1">
                        {player.reports.map(reportId => {
                          const stats = reportStats.find(r => r.report.id === reportId);
                          return (
                            <button
                              key={reportId}
                              onClick={() => stats && setSelectedReport(stats)}
                              className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                            >
                              {stats?.jornada ? `J${stats.jornada}` : reportId.substring(0, 20)}...
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'cards' && (
            <div className="space-y-2">
              {cardRankings.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.team.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((player, index) => (
                <div key={`${player.name}-${player.team}`} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.team}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-5 bg-warning rounded-sm" />
                        <span className="font-bold">{player.yellowCards}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-5 bg-destructive rounded-sm" />
                        <span className="font-bold">{player.redCards}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="glass-card p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold">¿Eliminar acta?</h3>
                  <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-sm mb-4">
                Se eliminarán las estadísticas de todos los jugadores de este partido. 
                Los goles y tarjetas registrados en esta acta ya no contarán en las estadísticas globales.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={!!deleting}
                  className="flex-1 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteReport(confirmDelete)}
                  disabled={!!deleting}
                  className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
