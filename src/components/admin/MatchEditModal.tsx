import { useState, useEffect } from 'react';
import { X, Save, Clock, Calendar, Play, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Match, Matchday, Team, MatchReport, MatchReportPlayer, Player } from '@/types/league';
import { LineupFormEditor } from './LineupFormEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MatchEditModalProps {
  match: Match;
  matchday: Matchday;
  teams: Team[];
  existingReport: MatchReport | null;
  onClose: () => void;
  onSave: () => void;
}

export function MatchEditModal({ 
  match, 
  matchday, 
  teams, 
  existingReport,
  onClose, 
  onSave 
}: MatchEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('result');
  
  // Match result state
  const [homeGoals, setHomeGoals] = useState(match.homeGoals || 0);
  const [awayGoals, setAwayGoals] = useState(match.awayGoals || 0);
  const [matchDate, setMatchDate] = useState(match.date || '');
  const [matchTime, setMatchTime] = useState(match.time || '');
  const [matchStatus, setMatchStatus] = useState<'PENDING' | 'LIVE' | 'PLAYED'>(match.status);
  
  // Lineup state
  const [observations, setObservations] = useState(existingReport?.observations || '');
  const [homePlayers, setHomePlayers] = useState<MatchReportPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchReportPlayer[]>([]);

  const homeTeam = teams.find(t => t.name === match.home);
  const awayTeam = teams.find(t => t.name === match.away);

  // Initialize players from existing report or team roster
  useEffect(() => {
    if (existingReport) {
      const homeData = existingReport[match.home];
      const awayData = existingReport[match.away];
      
      if (typeof homeData === 'object' && homeData && 'players' in homeData) {
        setHomePlayers((homeData as { players: MatchReportPlayer[] }).players || []);
      }
      if (typeof awayData === 'object' && awayData && 'players' in awayData) {
        setAwayPlayers((awayData as { players: MatchReportPlayer[] }).players || []);
      }
    }
  }, [existingReport, match.home, match.away]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update match in matchday document
      const matchdayRef = doc(db, 'matchdays', matchday.id);
      const matchdaySnap = await getDoc(matchdayRef);
      
      if (matchdaySnap.exists()) {
        const matchdayData = matchdaySnap.data();
        const updatedMatches = matchdayData.matches.map((m: Match) => {
          if (m.home === match.home && m.away === match.away) {
            return {
              ...m,
              homeGoals,
              awayGoals,
              date: matchDate,
              time: matchTime,
              status: matchStatus
            };
          }
          return m;
        });
        
        await updateDoc(matchdayRef, { matches: updatedMatches });
      }

      // 2. Save/update match report if we have players
      if (homePlayers.length > 0 || awayPlayers.length > 0) {
        const reportId = `${match.home}-${match.away}`;
        const reportRef = doc(db, 'match_reports', reportId);
        
        const reportData: MatchReport = {
          id: reportId,
          observations,
          [match.home]: { players: homePlayers },
          [match.away]: { players: awayPlayers }
        };

        await setDoc(reportRef, reportData, { merge: true });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLAYED': return 'bg-primary text-primary-foreground';
      case 'LIVE': return 'bg-destructive text-destructive-foreground';
      case 'PENDING': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">Editar Partido</h2>
            <p className="text-sm text-muted-foreground">
              Jornada {matchday.jornada} • {match.home} vs {match.away}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="result">Resultado</TabsTrigger>
              <TabsTrigger value="home">{match.home.split(' ').slice(0, 2).join(' ')}</TabsTrigger>
              <TabsTrigger value="away">{match.away.split(' ').slice(0, 2).join(' ')}</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Result Tab */}
            <TabsContent value="result" className="m-0 space-y-6">
              {/* Status selector */}
              <div className="space-y-2">
                <Label>Estado del partido</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'PENDING', label: 'Pendiente', icon: Calendar },
                    { value: 'LIVE', label: 'En Directo', icon: Play },
                    { value: 'PLAYED', label: 'Finalizado', icon: CheckCircle2 }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMatchStatus(value as 'PENDING' | 'LIVE' | 'PLAYED')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all',
                        matchStatus === value
                          ? getStatusColor(value)
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                {matchStatus === 'LIVE' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive">Partido en directo - Los cambios se verán inmediatamente</p>
                  </div>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      placeholder="DD-MM-YYYY"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      placeholder="HH:MM"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="space-y-2">
                <Label>Resultado</Label>
                <div className="glass-card p-6 bg-secondary/30">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex-1 text-center">
                      <p className="text-sm font-medium mb-2 truncate">{match.home}</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setHomeGoals(Math.max(0, homeGoals - 1))}
                          className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-lg font-bold"
                        >
                          -
                        </button>
                        <span className="text-4xl font-bold w-16 text-center tabular-nums">{homeGoals}</span>
                        <button
                          onClick={() => setHomeGoals(homeGoals + 1)}
                          className="w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <span className="text-2xl text-muted-foreground">-</span>
                    
                    <div className="flex-1 text-center">
                      <p className="text-sm font-medium mb-2 truncate">{match.away}</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setAwayGoals(Math.max(0, awayGoals - 1))}
                          className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-lg font-bold"
                        >
                          -
                        </button>
                        <span className="text-4xl font-bold w-16 text-center tabular-nums">{awayGoals}</span>
                        <button
                          onClick={() => setAwayGoals(awayGoals + 1)}
                          className="w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center text-lg font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observaciones del partido</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Incidencias, comentarios del árbitro..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Home Team Tab */}
            <TabsContent value="home" className="m-0">
              <LineupFormEditor
                teamName={match.home}
                teamRoster={homeTeam?.players || []}
                players={homePlayers}
                onPlayersChange={setHomePlayers}
              />
            </TabsContent>

            {/* Away Team Tab */}
            <TabsContent value="away" className="m-0">
              <LineupFormEditor
                teamName={match.away}
                teamRoster={awayTeam?.players || []}
                players={awayPlayers}
                onPlayersChange={setAwayPlayers}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer with save button */}
        <div className="sticky bottom-0 glass-card border-t border-border/50 p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {homePlayers.filter(p => p.isStarting).length} titulares local • 
            {awayPlayers.filter(p => p.isStarting).length} titulares visitante
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
