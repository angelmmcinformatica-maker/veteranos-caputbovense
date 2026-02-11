import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { X, Save, Clock, Calendar, Play, CheckCircle2, AlertTriangle, Loader2, Mic, MicOff, Gavel, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, updateDoc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Match, Matchday, Team, MatchReport, MatchReportPlayer, Player, User } from '@/types/league';
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
  userRole?: 'admin' | 'referee' | 'delegate';
  userTeamName?: string | null;
}

export function MatchEditModal({ 
  match, 
  matchday, 
  teams, 
  existingReport,
  onClose, 
  onSave,
  userRole = 'admin',
  userTeamName = null
}: MatchEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  // Set initial tab based on role - delegates go directly to their team's lineup
  const [activeTab, setActiveTab] = useState(() => {
    if (userRole === 'delegate') {
      if (userTeamName === match.home) return 'home';
      if (userTeamName === match.away) return 'away';
    }
    return 'result';
  });
  
  // Match result state
  const [homeGoals, setHomeGoals] = useState(match.homeGoals || 0);
  const [awayGoals, setAwayGoals] = useState(match.awayGoals || 0);
  const [matchDate, setMatchDate] = useState(match.date || '');
  const [matchTime, setMatchTime] = useState(match.time || '');
  const [matchStatus, setMatchStatus] = useState<'PENDING' | 'LIVE' | 'PLAYED' | 'POSTPONED'>(match.status === 'SCHEDULED' ? 'PENDING' : match.status as any);
  const [selectedReferee, setSelectedReferee] = useState<string>(match.referee || '');
  const [referees, setReferees] = useState<User[]>([]);
  
  // Lineup state
  const [observations, setObservations] = useState(existingReport?.observations || '');
  const [homePlayers, setHomePlayers] = useState<MatchReportPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchReportPlayer[]>([]);
  
  // Formation state
  const [homeFormation, setHomeFormation] = useState<string>('1-4-2-3-1');
  const [awayFormation, setAwayFormation] = useState<string>('1-4-2-3-1');
  
  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const homeTeam = teams.find(t => t.name === match.home);
  const awayTeam = teams.find(t => t.name === match.away);

  // Determine what the user can edit based on their role
  const canEditResult = userRole === 'admin' || userRole === 'referee';
  const canEditReferee = userRole === 'admin';
  const canEditHomeLineup = userRole === 'admin' || userRole === 'referee' || 
    (userRole === 'delegate' && userTeamName === match.home);
  const canEditAwayLineup = userRole === 'admin' || userRole === 'referee' || 
    (userRole === 'delegate' && userTeamName === match.away);

  // Fetch referees from Firestore
  useEffect(() => {
    const fetchReferees = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'referee'));
        const snapshot = await getDocs(q);
        const refereesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setReferees(refereesData);
      } catch (err) {
        console.error('Error fetching referees:', err);
      }
    };
    fetchReferees();
  }, []);

  // Initialize players and formations from existing report or team roster
  useEffect(() => {
    if (existingReport) {
      const homeData = existingReport[match.home];
      const awayData = existingReport[match.away];
      
      if (typeof homeData === 'object' && homeData && 'players' in homeData) {
        setHomePlayers((homeData as { players: MatchReportPlayer[] }).players || []);
        if ((homeData as any).formation) {
          setHomeFormation((homeData as any).formation);
        }
      }
      if (typeof awayData === 'object' && awayData && 'players' in awayData) {
        setAwayPlayers((awayData as { players: MatchReportPlayer[] }).players || []);
        if ((awayData as any).formation) {
          setAwayFormation((awayData as any).formation);
        }
      }
    }
  }, [existingReport, match.home, match.away]);

  // Voice dictation handlers
  const startListening = useCallback(() => {
    const win = window as any;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setObservations(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update match in matchday document
      const matchdayRef = doc(db, 'matchdays', matchday.id);
      const matchdaySnap = await getDoc(matchdayRef);
      
      if (matchdaySnap.exists()) {
        const matchdayData = matchdaySnap.data();
        // Find the selected referee's full name
        const refereeUser = referees.find(r => r.id === selectedReferee);
        const updatedMatches = matchdayData.matches.map((m: Match) => {
          if (m.home === match.home && m.away === match.away) {
            return {
              ...m,
              homeGoals: homeGoals || 0,
              awayGoals: awayGoals || 0,
              date: matchDate || '',
              time: matchTime || '',
              status: matchStatus,
              referee: selectedReferee || null,
              refereeName: refereeUser?.fullName || null
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
        
        // Clean and validate player data before saving
        const cleanPlayerData = (players: MatchReportPlayer[]): MatchReportPlayer[] => {
          return players.map(player => ({
            id: player.id,
            name: player.name || '',
            alias: player.alias || '',
            matchNumber: player.matchNumber || player.id,
            isStarting: Boolean(player.isStarting),
            substitutionMin: player.substitutionMin || '',
            goals: Number(player.goals) || 0,
            yellowCards: Number(player.yellowCards) || 0,
            redCards: Number(player.redCards) || 0,
            directRedCards: Number(player.directRedCards) || 0
          }));
        };

        const reportData = {
          id: reportId,
          observations: observations || '',
          [match.home]: { players: cleanPlayerData(homePlayers), formation: homeFormation },
          [match.away]: { players: cleanPlayerData(awayPlayers), formation: awayFormation }
        };

        await setDoc(reportRef, reportData, { merge: true });
      }

      onSave();
      toast.success('Partido guardado correctamente');
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error al guardar los cambios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLAYED': return 'bg-primary text-primary-foreground';
      case 'LIVE': return 'bg-destructive text-destructive-foreground';
      case 'POSTPONED': return 'bg-warning text-warning-foreground';
      case 'PENDING': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full h-full max-w-none rounded-none overflow-hidden flex flex-col">
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

        {/* Tabs - show only accessible tabs for delegates */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4">
            <TabsList className={cn(
              "grid w-full bg-secondary",
              userRole === 'delegate' ? 'grid-cols-2' : 'grid-cols-3'
            )}>
              {canEditResult && <TabsTrigger value="result">Resultado</TabsTrigger>}
              {canEditHomeLineup && <TabsTrigger value="home">{match.home.split(' ').slice(0, 2).join(' ')}</TabsTrigger>}
              {canEditAwayLineup && <TabsTrigger value="away">{match.away.split(' ').slice(0, 2).join(' ')}</TabsTrigger>}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Result Tab - only for admin and referee */}
            {canEditResult && (
            <TabsContent value="result" className="m-0 space-y-6">
              {/* Status selector */}
              <div className="space-y-2">
                <Label>Estado del partido</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'PENDING', label: 'Pendiente', icon: Calendar },
                    { value: 'LIVE', label: 'En Directo', icon: Play },
                    { value: 'PLAYED', label: 'Finalizado', icon: CheckCircle2 },
                    { value: 'POSTPONED', label: 'Aplazado', icon: Ban }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMatchStatus(value as 'PENDING' | 'LIVE' | 'PLAYED' | 'POSTPONED')}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-all',
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
                {matchStatus === 'POSTPONED' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <Ban className="w-4 h-4 text-warning" />
                    <p className="text-sm text-warning">Partido aplazado - No se jugará en la fecha prevista</p>
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

              {/* Score - hidden when POSTPONED */}
              {matchStatus !== 'POSTPONED' && (
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
              )}

              {/* Referee selector - only for admins */}
              {canEditReferee && (
              <div className="space-y-2">
                <Label htmlFor="referee">Árbitro asignado</Label>
                <div className="relative">
                  <Gavel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    id="referee"
                    value={selectedReferee}
                    onChange={(e) => setSelectedReferee(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none appearance-none"
                  >
                    <option value="">Sin árbitro asignado</option>
                    {referees.map(referee => (
                      <option key={referee.id} value={referee.id}>
                        {referee.fullName} ({referee.username})
                      </option>
                    ))}
                  </select>
                </div>
                {referees.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay árbitros registrados. Créalos en Gestión de Usuarios.
                  </p>
                )}
              </div>
              )}

              {/* Observations with voice dictation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="observations">Observaciones del partido</Label>
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleListening}
                    className="flex items-center gap-2"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Detener
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Dictar
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Incidencias, comentarios del árbitro... (puedes dictar con el micrófono)"
                  rows={3}
                  className={isListening ? 'ring-2 ring-destructive' : ''}
                />
                {isListening && (
                  <p className="text-xs text-destructive animate-pulse">🎤 Escuchando... Habla ahora</p>
                )}
              </div>
            </TabsContent>
            )}

            {/* Home Team Tab */}
            {canEditHomeLineup && (
            <TabsContent value="home" className="m-0">
              <LineupFormEditor
                teamName={match.home}
                teamRoster={homeTeam?.players || []}
                players={homePlayers}
                formation={homeFormation}
                onPlayersChange={setHomePlayers}
                onFormationChange={setHomeFormation}
              />
            </TabsContent>
            )}

            {/* Away Team Tab */}
            {canEditAwayLineup && (
            <TabsContent value="away" className="m-0">
              <LineupFormEditor
                teamName={match.away}
                teamRoster={awayTeam?.players || []}
                players={awayPlayers}
                formation={awayFormation}
                onPlayersChange={setAwayPlayers}
                onFormationChange={setAwayFormation}
              />
            </TabsContent>
            )}
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
