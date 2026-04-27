import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, CheckCircle2, Edit2, Play, Clock, RefreshCw, Eye, Loader2, Trophy, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matchday, Match, MatchReport, Team, MatchReportPlayer } from '@/types/league';
import { MatchEditModal } from './MatchEditModal';
import { Button } from '@/components/ui/button';
import {
  PLAYOFF_DEFAULT_MATCHDAYS,
  PLAYOFF_LABELS,
  PLAYOFF_ID_PREFIX,
} from '@/data/playoffsBracket';

interface AdminPlayoffsViewProps {
  teams: Team[];
  matchReports: MatchReport[];
  /** Live playoff matchdays from useLeagueData (onSnapshot). When provided, the
   *  view renders these directly so admin edits reflect instantly without a
   *  manual reload, and the auto-advance hook can react to results. */
  playoffMatchdays?: Matchday[];
  onClose: () => void;
  onDataChange: () => void;
}

export function AdminPlayoffsView({
  teams,
  matchReports,
  playoffMatchdays: livePlayoffMatchdays,
  onClose,
  onDataChange,
}: AdminPlayoffsViewProps) {
  const [localPlayoffMatchdays, setLocalPlayoffMatchdays] = useState<Matchday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(PLAYOFF_DEFAULT_MATCHDAYS[0].id);
  const [editingMatch, setEditingMatch] = useState<{ match: Match; matchday: Matchday } | null>(null);
  const [viewingReport, setViewingReport] = useState<{ report: MatchReport; match: Match } | null>(null);

  // Prefer live snapshot data; fall back to one-shot fetch only until snapshot
  // delivers its first batch (avoids a flash of empty state on first open).
  const playoffMatchdays =
    livePlayoffMatchdays && livePlayoffMatchdays.length > 0
      ? livePlayoffMatchdays
      : localPlayoffMatchdays;

  // Load playoff matchdays from Firestore. If a round doesn't exist yet, seed
  // it with the default bracket so the admin can edit it immediately using the
  // exact same MatchEditModal as the regular league.
  const loadPlayoffs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'matchdays'));
      const existing: Record<string, Matchday> = {};
      snap.docs
        .filter(d => d.id.startsWith(PLAYOFF_ID_PREFIX))
        .forEach(d => {
          const data = d.data() as any;
          existing[d.id] = {
            id: d.id,
            jornada: data.jornada,
            date: data.date || '',
            rest: data.rest ?? null,
            matches: (data.matches || []).map((m: any) => ({
              ...m,
              date: m.date || data.date || '',
              status: m.status === 'SCHEDULED' ? 'PENDING' : m.status,
            })),
          } as Matchday;
        });

      // Seed any missing default rounds in Firestore so the modal can update them
      const merged: Matchday[] = [];
      const validTeamNames = new Set(teams.map(t => t.name));

      for (const def of PLAYOFF_DEFAULT_MATCHDAYS) {
        if (existing[def.id]) {
          // Migration: if existing playoff doc has team names that don't match
          // any team in the Firestore 'teams' collection (e.g. legacy Title-Case
          // names from previous seed), patch them to the canonical uppercase
          // names defined in PLAYOFF_DEFAULT_MATCHDAYS so the lineup editor can
          // resolve the roster.
          const cur = existing[def.id];
          let needsPatch = false;
          const patchedMatches = cur.matches.map((m, idx) => {
            const defMatch = def.matches[idx];
            const next = { ...m };
            if (defMatch && !validTeamNames.has(m.home) && validTeamNames.has(defMatch.home)) {
              next.home = defMatch.home;
              needsPatch = true;
            }
            if (defMatch && !validTeamNames.has(m.away) && validTeamNames.has(defMatch.away)) {
              next.away = defMatch.away;
              needsPatch = true;
            }
            return next;
          });

          if (needsPatch) {
            try {
              await setDoc(
                doc(db, 'matchdays', def.id),
                {
                  jornada: cur.jornada,
                  date: cur.date,
                  rest: cur.rest,
                  matches: patchedMatches,
                  isPlayoff: true,
                },
                { merge: true }
              );
              cur.matches = patchedMatches;
              console.log(`[Playoffs] Migrated team names for ${def.id}`);
            } catch (e) {
              console.error(`[Playoffs] Failed to migrate ${def.id}:`, e);
            }
          }
          merged.push(cur);
        } else {
          await setDoc(doc(db, 'matchdays', def.id), {
            jornada: def.jornada,
            date: def.date,
            rest: def.rest,
            matches: def.matches,
            isPlayoff: true,
          });
          merged.push(def);
        }
      }
      setLocalPlayoffMatchdays(merged);
    } catch (err) {
      console.error('Error loading playoff matchdays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayoffs();
  }, []);

  const refresh = async () => {
    await loadPlayoffs();
    onDataChange();
  };

  const selectedMatchday = playoffMatchdays.find(md => md.id === selectedId) || null;

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
  };

  const isCopa = (id: string) => id.startsWith('playoff-copa');

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
      case 'POSTPONED':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warning/20 text-warning font-bold">
            ⚠️ APLAZADO
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
      <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full h-full max-w-none rounded-none flex flex-col">
          {/* Header */}
          <div className="shrink-0 border-b border-border/50 px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold">Gestión de Play-offs</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={refresh} className="h-7 text-xs px-2">
                <RefreshCw className="w-3 h-3 mr-1" />
                Actualizar
              </Button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Round selector */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {PLAYOFF_DEFAULT_MATCHDAYS.map(md => {
                const active = selectedId === md.id;
                const copa = isCopa(md.id);
                return (
                  <button
                    key={md.id}
                    onClick={() => setSelectedId(md.id)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
                      active
                        ? copa
                          ? 'bg-muted-foreground/20 text-foreground border-white/30'
                          : 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    {PLAYOFF_LABELS[md.id] || md.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matches list (mirrors AdminMatchesView layout) */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : selectedMatchday?.matches && selectedMatchday.matches.length > 0 ? (
              <>
                <div className="text-center mb-3">
                  <h3 className="text-sm font-bold flex items-center justify-center gap-2">
                    {isCopa(selectedMatchday.id) ? (
                      <Award className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Trophy className="w-4 h-4 text-primary" />
                    )}
                    {PLAYOFF_LABELS[selectedMatchday.id]}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Partido único · El equipo con mayor Deportividad juega como local
                  </p>
                </div>

                <div
                  className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  style={{ gridAutoRows: 'min-content' }}
                >
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
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  'text-sm font-medium break-words',
                                  match.status === 'PLAYED' && match.homeGoals > match.awayGoals && 'text-primary'
                                )}
                              >
                                {match.home}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={cn(
                                  'w-8 h-8 rounded bg-secondary flex items-center justify-center text-lg font-bold',
                                  match.status === 'PENDING' && 'text-muted-foreground text-base'
                                )}
                              >
                                {match.status === 'PLAYED' || match.status === 'LIVE' ? match.homeGoals : '-'}
                              </span>
                              <span className="text-muted-foreground text-sm">:</span>
                              <span
                                className={cn(
                                  'w-8 h-8 rounded bg-secondary flex items-center justify-center text-lg font-bold',
                                  match.status === 'PENDING' && 'text-muted-foreground text-base'
                                )}
                              >
                                {match.status === 'PLAYED' || match.status === 'LIVE' ? match.awayGoals : '-'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p
                                className={cn(
                                  'text-sm font-medium break-words',
                                  match.status === 'PLAYED' && match.awayGoals > match.homeGoals && 'text-primary'
                                )}
                              >
                                {match.away}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mb-2">
                            {getStatusBadge(match.status)}
                            <span className="text-xs text-muted-foreground">
                              {match.date} {match.time && `• ${match.time}`}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {hasReport && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setViewingReport({ report: report!, match })}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              className={hasReport ? 'flex-1' : 'w-full'}
                              onClick={() => setEditingMatch({ match, matchday: selectedMatchday })}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              {hasReport ? 'Editar' : 'Acta'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay partidos para esta ronda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reuse the exact same MatchEditModal used for regular league matches */}
      {editingMatch && (
        <MatchEditModal
          match={editingMatch.match}
          matchday={editingMatch.matchday}
          teams={teams}
          existingReport={getMatchReport(editingMatch.match)}
          onClose={() => setEditingMatch(null)}
          onSave={refresh}
          userRole="admin"
          userTeamName={null}
        />
      )}

      {/* Simple report viewer (kept consistent with AdminMatchesView) */}
      {viewingReport && (
        <ReportViewModal
          report={viewingReport.report}
          match={viewingReport.match}
          onClose={() => setViewingReport(null)}
          onEdit={() => {
            const md = playoffMatchdays.find(m =>
              m.matches?.some(x => x.home === viewingReport.match.home && x.away === viewingReport.match.away)
            );
            if (md) setEditingMatch({ match: viewingReport.match, matchday: md });
            setViewingReport(null);
          }}
        />
      )}
    </>
  );
}

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
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Titulares ({starters.length})</p>
          {starters.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-primary/10 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5">#{p.matchNumber}</span>
                <span>{p.alias || p.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {p.goals > 0 && <span className="text-primary text-xs">⚽{p.goals}</span>}
                {p.yellowCards > 0 && <span className="w-2 h-3 bg-warning rounded-sm" />}
                {(p.redCards > 0 || p.directRedCards > 0) && <span className="w-2 h-3 bg-destructive rounded-sm" />}
              </div>
            </div>
          ))}
        </div>
        {subs.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-1">Suplentes ({subs.length})</p>
            {subs.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">#{p.matchNumber}</span>
                  <span>{p.alias || p.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {p.goals > 0 && <span className="text-primary text-xs">⚽{p.goals}</span>}
                  {p.yellowCards > 0 && <span className="w-2 h-3 bg-warning rounded-sm" />}
                  {(p.redCards > 0 || p.directRedCards > 0) && <span className="w-2 h-3 bg-destructive rounded-sm" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full h-full max-w-none rounded-none flex flex-col">
        <div className="shrink-0 border-b border-border/50 px-3 py-2 flex items-center justify-between">
          <h2 className="text-base font-bold">
            Acta · {match.home} vs {match.away}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={onEdit}>
              <Edit2 className="w-3 h-3 mr-1" /> Editar
            </Button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid gap-4 md:grid-cols-2">
          {renderPlayerList(homePlayers, match.home)}
          {renderPlayerList(awayPlayers, match.away)}
        </div>
      </div>
    </div>
  );
}
