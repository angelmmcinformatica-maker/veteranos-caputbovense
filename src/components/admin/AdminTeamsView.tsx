import { useState } from 'react';
import { X, Users, User, Search, Edit2, Trash2, Save, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, MatchReport, MatchReportPlayer, Player } from '@/types/league';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminTeamsViewProps {
  teams: Team[];
  matchReports: MatchReport[];
  onClose: () => void;
  onDataChange?: () => void;
}

export function AdminTeamsView({ teams, matchReports, onClose, onDataChange }: AdminTeamsViewProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [editId, setEditId] = useState<string>('');

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlayerStats = (playerName: string, teamName: string) => {
    let goals = 0, yellowCards = 0, redCards = 0, gamesPlayed = 0, gamesStarted = 0;

    matchReports.forEach(report => {
      const teamData = report[teamName];
      if (typeof teamData === 'object' && teamData && 'players' in teamData) {
        const players = (teamData as { players: MatchReportPlayer[] }).players || [];
        const player = players.find(p => p.name === playerName);
        if (player) {
          gamesPlayed++;
          if (player.isStarting) gamesStarted++;
          goals += player.goals || 0;
          yellowCards += player.yellowCards || 0;
          redCards += (player.redCards || 0) + (player.directRedCards || 0);
        }
      }
    });

    return { goals, yellowCards, redCards, gamesPlayed, gamesStarted };
  };

  const startEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditAlias(player.alias || '');
    setEditId(String(player.id));
  };

  const startAddPlayer = () => {
    setShowAddPlayer(true);
    setEditName('');
    setEditAlias('');
    // Generate next ID
    const maxId = Math.max(0, ...(selectedTeam?.players?.map(p => Number(p.id)) || []));
    setEditId(String(maxId + 1));
  };

  const savePlayer = async () => {
    if (!selectedTeam || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      const teamRef = doc(db, 'teams', selectedTeam.id);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        let updatedPlayers: Player[];
        
        if (editingPlayer) {
          // Update existing player
          updatedPlayers = (teamData.players || []).map((p: Player) => {
            if (p.id === editingPlayer.id) {
              return {
                ...p,
                id: editId ? Number(editId) : p.id,
                name: editName.trim(),
                alias: editAlias.trim() || null
              };
            }
            return p;
          });
        } else {
          // Add new player
          updatedPlayers = [
            ...(teamData.players || []),
            {
              id: editId ? Number(editId) : Date.now(),
              name: editName.trim(),
              alias: editAlias.trim() || null
            }
          ];
        }
        
        await updateDoc(teamRef, { players: updatedPlayers });
        
        // Update local state
        if (selectedTeam) {
          setSelectedTeam({
            ...selectedTeam,
            players: updatedPlayers
          });
        }
        
        onDataChange?.();
      }
      
      setEditingPlayer(null);
      setShowAddPlayer(false);
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Error al guardar el jugador');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlayer = async () => {
    if (!selectedTeam || !playerToDelete) return;
    
    setIsSaving(true);
    try {
      const teamRef = doc(db, 'teams', selectedTeam.id);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        const updatedPlayers = (teamData.players || []).filter(
          (p: Player) => p.id !== playerToDelete.id
        );
        
        await updateDoc(teamRef, { players: updatedPlayers });
        
        // Update local state
        setSelectedTeam({
          ...selectedTeam,
          players: updatedPlayers
        });
        
        onDataChange?.();
      }
      
      setPlayerToDelete(null);
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error al eliminar el jugador');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 glass-card border-b border-border/50 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {selectedTeam ? selectedTeam.name : 'Gestión de Equipos'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedTeam 
                  ? `${selectedTeam.players?.length || 0} jugadores`
                  : `${teams.length} equipos registrados`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedTeam ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="text-sm text-primary hover:underline"
                  >
                    ← Volver a equipos
                  </button>
                  <Button size="sm" onClick={startAddPlayer}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir jugador
                  </Button>
                </div>

                {/* Add/Edit player form */}
                {(editingPlayer || showAddPlayer) && (
                  <div className="glass-card p-4 bg-primary/5 border border-primary/20 space-y-3">
                    <h4 className="font-semibold">
                      {editingPlayer ? 'Editar jugador' : 'Nuevo jugador'}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Dorsal</Label>
                        <Input
                          value={editId}
                          onChange={(e) => setEditId(e.target.value)}
                          placeholder="1"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nombre completo</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nombre Apellidos"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Alias (opcional)</Label>
                        <Input
                          value={editAlias}
                          onChange={(e) => setEditAlias(e.target.value)}
                          placeholder="Apodo"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingPlayer(null);
                          setShowAddPlayer(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={savePlayer}
                        disabled={isSaving || !editName.trim()}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {selectedTeam.players?.map((player) => {
                    const stats = getPlayerStats(player.name, selectedTeam.name);
                    
                    return (
                      <div
                        key={player.id}
                        className="glass-card p-3 bg-secondary/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold">
                              {player.id}
                            </div>
                            <div>
                              <p className="font-medium">
                                {player.alias || player.name}
                              </p>
                              {player.alias && (
                                <p className="text-xs text-muted-foreground">{player.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-4 text-sm mr-4">
                              <div className="text-center">
                                <p className="font-bold">{stats.gamesPlayed}</p>
                                <p className="text-xs text-muted-foreground">PJ</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold">{stats.gamesStarted}</p>
                                <p className="text-xs text-muted-foreground">Titular</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-primary">{stats.goals}</p>
                                <p className="text-xs text-muted-foreground">Goles</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-4 bg-warning rounded-sm" />
                                <span className="font-medium">{stats.yellowCards}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-4 bg-destructive rounded-sm" />
                                <span className="font-medium">{stats.redCards}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditPlayer(player)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setPlayerToDelete(player)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(!selectedTeam.players || selectedTeam.players.length === 0) && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay jugadores registrados</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar equipo..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                {/* Teams list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className="glass-card p-4 text-left hover:ring-1 hover:ring-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team.players?.length || 0} jugadores
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredTeams.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No se encontraron equipos</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!playerToDelete} onOpenChange={() => setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a{' '}
              <strong>{playerToDelete?.alias || playerToDelete?.name}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deletePlayer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
