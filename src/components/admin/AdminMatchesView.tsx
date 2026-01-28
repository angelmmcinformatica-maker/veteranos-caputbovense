import { useState } from 'react';
import { X, Calendar, CheckCircle2, FileText, Edit2, Play, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matchday, Match, MatchReport, Team } from '@/types/league';
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

  const selectedMatchday = matchdays.find(md => md.jornada === selectedJornada);

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Gestión de Partidos</h2>
              <p className="text-sm text-muted-foreground">Editar resultados, horarios y alineaciones</p>
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

          {/* Jornada selector */}
          <div className="p-4 border-b border-border/30">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
              {matchdays.map(md => {
                const hasLiveMatch = md.matches?.some(m => m.status === 'LIVE');
                return (
                  <button
                    key={md.jornada}
                    onClick={() => setSelectedJornada(md.jornada)}
                    className={cn(
                      'flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all relative',
                      selectedJornada === md.jornada
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Jornada {md.jornada}
                    {hasLiveMatch && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matches list */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedMatchday?.matches && selectedMatchday.matches.length > 0 ? (
              <div className="space-y-3">
                {selectedMatchday.matches.map((match, index) => {
                  const hasReport = !!getMatchReport(match);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        'glass-card p-4',
                        match.status === 'LIVE' ? 'bg-destructive/5 ring-1 ring-destructive/30' : 'bg-secondary/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(match.status)}
                          <span className="text-xs text-muted-foreground">
                            {match.date} {match.time && `• ${match.time}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasReport && (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <FileText className="w-3 h-3" />
                              Acta
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm font-medium',
                            match.status === 'PLAYED' && match.homeGoals > match.awayGoals && 'text-primary'
                          )}>
                            {match.home}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 px-4">
                          {match.status === 'PLAYED' || match.status === 'LIVE' ? (
                            <>
                              <span className={cn(
                                'text-2xl font-bold tabular-nums',
                                match.homeGoals > match.awayGoals && 'text-primary'
                              )}>
                                {match.homeGoals}
                              </span>
                              <span className="text-muted-foreground">-</span>
                              <span className={cn(
                                'text-2xl font-bold tabular-nums',
                                match.awayGoals > match.homeGoals && 'text-primary'
                              )}>
                                {match.awayGoals}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground font-medium">
                              {match.time || 'vs'}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 text-right">
                          <p className={cn(
                            'text-sm font-medium',
                            match.status === 'PLAYED' && match.awayGoals > match.homeGoals && 'text-primary'
                          )}>
                            {match.away}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/30">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setEditingMatch({ match, matchday: selectedMatchday })}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar partido
                        </Button>
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
