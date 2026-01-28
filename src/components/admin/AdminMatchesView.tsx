import { useState } from 'react';
import { X, Calendar, CheckCircle2, FileText, Edit2, Play, Clock, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matchday, Match, MatchReport, Team, MatchReportPlayer } from '@/types/league';
import { MatchEditModal } from './MatchEditModal';
import { Button } from '@/components/ui/button';

interface AdminMatchesViewProps {
  matchdays: Matchday[];
  matchReports: MatchReport[];
  teams: Team[];
  onClose: () => void;
  onDataChange: () => void;
}

export function AdminMatchesView({ matchdays, matchReports, teams, onClose, onDataChange }: AdminMatchesViewProps) {
  const [selectedJornada, setSelectedJornada] = useState<number>(() => {
    const playedMatchdays = matchdays.filter(md => 
      md.matches?.some(m => m.status === 'PLAYED')
    );
    return playedMatchdays[playedMatchdays.length - 1]?.jornada || matchdays[0]?.jornada || 1;
  });
  const [editingMatch, setEditingMatch] = useState<{ match: Match; matchday: Matchday } | null>(null);
  const [viewingReport, setViewingReport] = useState<{ report: MatchReport; match: Match } | null>(null);

  const selectedMatchday = matchdays.find(md => md.jornada === selectedJornada);
  const sortedMatchdays = [...matchdays].sort((a, b) => a.jornada - b.jornada);

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
  };

  const goToPrevJornada = () => {
    const idx = sortedMatchdays.findIndex(md => md.jornada === selectedJornada);
    if (idx > 0) {
      setSelectedJornada(sortedMatchdays[idx - 1].jornada);
    }
  };

  const goToNextJornada = () => {
    const idx = sortedMatchdays.findIndex(md => md.jornada === selectedJornada);
    if (idx < sortedMatchdays.length - 1) {
      setSelectedJornada(sortedMatchdays[idx + 1].jornada);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLAYED':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
            <CheckCircle2 className="w-3 h-3" />
            Finalizado
          </span>
        );
      case 'LIVE':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive animate-pulse">
            <Play className="w-3 h-3 fill-current" />
            En Directo
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
    }
  };

  const getTeamPlayers = (report: MatchReport, teamName: string): MatchReportPlayer[] => {
    const teamData = report[teamName];
    if (typeof teamData === 'string' || !teamData) return [];
    return (teamData as { players: MatchReportPlayer[] }).players || [];
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Gestión de Partidos</h2>
              <p className="text-sm text-muted-foreground">Editar resultados, alineaciones y actas</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onDataChange}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Jornada selector with arrows */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={goToPrevJornada}
                disabled={selectedJornada === sortedMatchdays[0]?.jornada}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold min-w-[140px] text-center">Jornada {selectedJornada}</h3>
              <button
                onClick={goToNextJornada}
                disabled={selectedJornada === sortedMatchdays[sortedMatchdays.length - 1]?.jornada}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quick jornada pills */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar mt-3 justify-center">
              {sortedMatchdays.map(md => {
                const hasLiveMatch = md.matches?.some(m => m.status === 'LIVE');
                return (
                  <button
                    key={md.jornada}
                    onClick={() => setSelectedJornada(md.jornada)}
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full text-xs font-medium transition-all relative',
                      selectedJornada === md.jornada
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {md.jornada}
                    {hasLiveMatch && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matches list */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedMatchday?.matches && selectedMatchday.matches.length > 0 ? (
              <div className="space-y-4">
                {selectedMatchday.matches.map((match, index) => {
                  const report = getMatchReport(match);
                  const hasReport = !!report;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        'glass-card overflow-hidden',
                        match.status === 'LIVE' ? 'ring-2 ring-destructive/50' : ''
                      )}
                    >
                      {/* Match info */}
                      <div className="p-4">
                        {/* Teams and score */}
                        <div className="text-center mb-4">
                          <p className={cn(
                            'font-semibold',
                            match.status === 'PLAYED' && match.homeGoals > match.awayGoals && 'text-primary'
                          )}>
                            {match.home}
                          </p>
                          
                          <div className="flex items-center justify-center gap-3 my-3">
                            <div className={cn(
                              'w-14 h-14 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold',
                              match.status === 'PLAYED' || match.status === 'LIVE' ? '' : 'text-muted-foreground'
                            )}>
                              {match.status === 'PLAYED' || match.status === 'LIVE' ? match.homeGoals : '-'}
                            </div>
                            <span className="text-muted-foreground text-xl">-</span>
                            <div className={cn(
                              'w-14 h-14 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold',
                              match.status === 'PLAYED' || match.status === 'LIVE' ? '' : 'text-muted-foreground'
                            )}>
                              {match.status === 'PLAYED' || match.status === 'LIVE' ? match.awayGoals : '-'}
                            </div>
                          </div>
                          
                          <p className={cn(
                            'font-semibold',
                            match.status === 'PLAYED' && match.awayGoals > match.homeGoals && 'text-primary'
                          )}>
                            {match.away}
                          </p>
                        </div>

                        {/* Date, time and status */}
                        <div className="flex items-center justify-center gap-3 mb-4">
                          {getStatusBadge(match.status)}
                          <span className="text-xs text-muted-foreground">
                            {match.date} {match.time && `• ${match.time}`}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2">
                          {hasReport && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => setViewingReport({ report: report!, match })}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Acta
                            </Button>
                          )}
                          <Button
                            variant="default"
                            className="w-full"
                            onClick={() => setEditingMatch({ match, matchday: selectedMatchday })}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            {hasReport ? 'Editar Partido' : 'Rellenar Acta'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay partidos para esta jornada</p>
              </div>
            )}

            {selectedMatchday?.rest && (
              <div className="glass-card p-4 mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Descansa: <span className="font-medium text-foreground">{selectedMatchday.rest}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Report Modal */}
      {viewingReport && (
        <ReportViewModal
          report={viewingReport.report}
          match={viewingReport.match}
          onClose={() => setViewingReport(null)}
          onEdit={() => {
            setViewingReport(null);
            if (selectedMatchday) {
              setEditingMatch({ match: viewingReport.match, matchday: selectedMatchday });
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {editingMatch && (
        <MatchEditModal
          match={editingMatch.match}
          matchday={editingMatch.matchday}
          teams={teams}
          existingReport={getMatchReport(editingMatch.match)}
          onClose={() => setEditingMatch(null)}
          onSave={onDataChange}
        />
      )}
    </>
  );
}

// Report View Modal Component
interface ReportViewModalProps {
  report: MatchReport;
  match: Match;
  onClose: () => void;
  onEdit: () => void;
}

function ReportViewModal({ report, match, onClose, onEdit }: ReportViewModalProps) {
  const getTeamPlayers = (teamName: string): MatchReportPlayer[] => {
    const teamData = report[teamName];
    if (typeof teamData === 'string' || !teamData) return [];
    return (teamData as { players: MatchReportPlayer[] }).players || [];
  };

  const homePlayers = getTeamPlayers(match.home);
  const awayPlayers = getTeamPlayers(match.away);

  const renderPlayerList = (players: MatchReportPlayer[], title: string) => {
    const starters = players.filter(p => p.isStarting);
    const subs = players.filter(p => !p.isStarting);

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        
        {/* Starters */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Titulares ({starters.length})</p>
          {starters.map((player, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-primary/10 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5">#{player.matchNumber}</span>
                <span>{player.alias || player.name}</span>
                {player.substitutionMin && (
                  <span className="text-xs text-destructive">↓ {player.substitutionMin}'</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {player.goals > 0 && <span className="text-primary text-xs">⚽{player.goals}</span>}
                {player.yellowCards > 0 && <span className="w-2 h-3 bg-warning rounded-sm" />}
                {(player.redCards > 0 || player.directRedCards > 0) && <span className="w-2 h-3 bg-destructive rounded-sm" />}
              </div>
            </div>
          ))}
        </div>

        {/* Substitutes */}
        {subs.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-1">Suplentes ({subs.length})</p>
            {subs.map((player, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">#{player.matchNumber}</span>
                  <span>{player.alias || player.name}</span>
                  {player.substitutionMin && (
                    <span className="text-xs text-primary">↑ {player.substitutionMin}'</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {player.goals > 0 && <span className="text-primary text-xs">⚽{player.goals}</span>}
                  {player.yellowCards > 0 && <span className="w-2 h-3 bg-warning rounded-sm" />}
                  {(player.redCards > 0 || player.directRedCards > 0) && <span className="w-2 h-3 bg-destructive rounded-sm" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Acta del Partido</h2>
            <p className="text-sm text-muted-foreground">{match.home} vs {match.away}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Score */}
          <div className="glass-card p-4 bg-secondary/30 text-center">
            <div className="flex items-center justify-center gap-4">
              <span className="font-semibold">{match.home}</span>
              <span className="text-2xl font-bold text-primary">{match.homeGoals} - {match.awayGoals}</span>
              <span className="font-semibold">{match.away}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderPlayerList(homePlayers, match.home)}
            {renderPlayerList(awayPlayers, match.away)}
          </div>

          {/* Observations */}
          {report.observations && typeof report.observations === 'string' && (
            <div className="glass-card p-4">
              <h4 className="font-semibold text-sm mb-2">Observaciones</h4>
              <p className="text-sm text-muted-foreground">{report.observations}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 glass-card border-t border-border/50 p-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button onClick={onEdit} className="flex-1">
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}
