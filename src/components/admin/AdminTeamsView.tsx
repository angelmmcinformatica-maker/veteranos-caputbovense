import { useMemo, useState } from 'react';
import { X, Users, User, Search, Edit2, Trash2, Save, Plus, Loader2, Shield, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, MatchReport, MatchReportPlayer, Player } from '@/types/league';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { useImageUpload, getPlayerPhotoPath, getTeamShieldPath } from '@/hooks/useImageUpload';
import { useTeamImages } from '@/hooks/useTeamImages';
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
  const [editingPlayer, setEditingPlayer] = useState<{ player: Player; occurrence: number } | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<{ player: Player; occurrence: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showDedupConfirm, setShowDedupConfirm] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  
  // Image upload hooks
  const { uploadImage } = useImageUpload();
  const { getTeamShield, getPlayerPhoto, setTeamShield, setPlayerPhoto, removePlayerPhoto } = useTeamImages();
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [editId, setEditId] = useState<string>('');

  // Deduplicate teams by id and filter by search term
  const filteredTeams = useMemo(() => {
    const seenIds = new Set<string>();
    return teams.filter(team => {
      if (seenIds.has(team.id)) return false;
      seenIds.add(team.id);
      return team.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [teams, searchTerm]);

  const toNumeric = (v: string | number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  const playerSig = (p: Player) => {
    const id = String(p.id).trim();
    const name = String(p.name || '').trim().toLowerCase();
    const alias = String(p.alias || '').trim().toLowerCase();
    return `${id}|${name}|${alias}`;
  };

  const findNthIndex = <T,>(arr: T[], pred: (v: T) => boolean, occurrence: number) => {
    let seen = 0;
    for (let i = 0; i < arr.length; i++) {
      if (!pred(arr[i])) continue;
      if (seen === occurrence) return i;
      seen++;
    }
    return -1;
  };

  const playersForDisplay = useMemo(() => {
    const raw = selectedTeam?.players || [];
    const occurrenceCounter = new Map<string, number>();
    const withMeta = raw.map((player, originalIndex) => {
      const sig = playerSig(player);
      const occ = occurrenceCounter.get(sig) ?? 0;
      occurrenceCounter.set(sig, occ + 1);
      return { player, sig, occurrence: occ, originalIndex };
    });
    withMeta.sort((a, b) => {
      const an = toNumeric(a.player.id);
      const bn = toNumeric(b.player.id);
      if (an !== bn) return an - bn;
      return String(a.player.name).localeCompare(String(b.player.name));
    });
    return withMeta;
  }, [selectedTeam]);

  const duplicateCount = useMemo(() => {
    const raw = selectedTeam?.players || [];
    const counts = new Map<string, number>();
    raw.forEach((p) => counts.set(playerSig(p), (counts.get(playerSig(p)) ?? 0) + 1));
    let dups = 0;
    counts.forEach((count) => {
      if (count > 1) dups += count - 1;
    });
    return dups;
  }, [selectedTeam]);

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

  const startEditPlayer = (player: Player, occurrence: number) => {
    setEditingPlayer({ player, occurrence });
    setEditName(player.name);
    setEditAlias(player.alias || '');
    setEditId(String(player.id));
  };

  const startAddPlayer = () => {
    setShowAddPlayer(true);
    setEditName('');
    setEditAlias('');
    // Generate next ID
    const maxId = Math.max(0, ...(selectedTeam?.players?.map(p => Number(p.id)) || []).filter(n => Number.isFinite(n)));
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
        
        const rawPlayers: Player[] = teamData.players || [];

        if (editingPlayer) {
          // Update EXACT duplicated instance by signature + occurrence
          const targetSig = playerSig(editingPlayer.player);
          const idx = findNthIndex(
            rawPlayers,
            (p) => playerSig(p) === targetSig,
            editingPlayer.occurrence,
          );

          if (idx === -1) {
            alert('No se encontró el jugador');
            setIsSaving(false);
            return;
          }

          updatedPlayers = rawPlayers.map((p, i) =>
            i === idx
              ? {
                  ...p,
                  id: editId ? Number(editId) : p.id,
                  name: editName.trim(),
                  alias: editAlias.trim() || null,
                }
              : p,
          );
        } else {
          // Add new player
          updatedPlayers = [
            ...rawPlayers,
            {
              id: editId ? Number(editId) : Date.now(),
              name: editName.trim(),
              alias: editAlias.trim() || null
            }
          ];
        }

        // Always keep ordered by dorsal
        updatedPlayers.sort((a, b) => {
          const an = toNumeric(a.id);
          const bn = toNumeric(b.id);
          if (an !== bn) return an - bn;
          return String(a.name).localeCompare(String(b.name));
        });
        
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
        const playersArray: Player[] = teamData.players || [];

        const targetSig = playerSig(playerToDelete.player);
        const playerIndex = findNthIndex(playersArray, (p) => playerSig(p) === targetSig, playerToDelete.occurrence);
        
        if (playerIndex === -1) {
          alert('No se encontró el jugador');
       setPlayerToDelete(null);
          setIsSaving(false);
          return;
        }
        
        // Remove only ONE player at the found index
        const updatedPlayers = [
          ...playersArray.slice(0, playerIndex),
          ...playersArray.slice(playerIndex + 1)
        ];
        
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

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    
    setIsSaving(true);
    try {
      // Create a sanitized ID from the team name
      const teamId = newTeamName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const teamRef = doc(db, 'teams', teamId);
      
      // Check if team already exists
      const existingDoc = await getDoc(teamRef);
      if (existingDoc.exists()) {
        alert('Ya existe un equipo con ese nombre');
        setIsSaving(false);
        return;
      }
      
      await setDoc(teamRef, {
        name: newTeamName.trim(),
        players: []
      });
      
      setShowAddTeam(false);
      setNewTeamName('');
      onDataChange?.();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error al crear el equipo');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTeam = async () => {
    if (!teamToDelete) return;
    
    setIsSaving(true);
    try {
      const teamRef = doc(db, 'teams', teamToDelete.id);
      await deleteDoc(teamRef);
      
      setTeamToDelete(null);
      onDataChange?.();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Error al eliminar el equipo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 pb-4 px-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="glass-card w-full max-w-6xl flex flex-col bg-background border border-border shadow-2xl rounded-xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          {/* Header - always visible */}
          <div className="shrink-0 glass-card border-b border-border/50 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">
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
              className="shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedTeam ? (
            <div className="space-y-4">
                {/* Team header with shield upload */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="text-sm text-primary hover:underline"
                    >
                      ← Volver a equipos
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {duplicateCount > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setShowDedupConfirm(true)}>
                        Limpiar duplicados ({duplicateCount})
                      </Button>
                    )}
                    <Button size="sm" onClick={startAddPlayer}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir jugador
                    </Button>
                  </div>
                </div>

                {/* Team shield upload section */}
                <div className="glass-card p-4 bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <ImageUpload
                      currentUrl={getTeamShield(selectedTeam.name)}
                      onUpload={async (file) => {
                        const path = getTeamShieldPath(selectedTeam.name);
                        const url = await uploadImage(file, path);
                        await setTeamShield(selectedTeam.name, url);
                      }}
                      size="lg"
                      shape="square"
                      placeholder={<Shield className="w-8 h-8 text-muted-foreground" />}
                    />
                    <div>
                      <h4 className="font-semibold">Escudo del equipo</h4>
                      <p className="text-sm text-muted-foreground">
                        Haz clic para subir el escudo (máx. 5MB)
                      </p>
                    </div>
                  </div>
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
                   {playersForDisplay.map(({ player, occurrence, originalIndex }) => {
                     const stats = getPlayerStats(player.name, selectedTeam.name);
                     const playerPhotoUrl = getPlayerPhoto(selectedTeam.name, player.id);
                    
                    return (
                      <div
                         key={`${player.id}-${player.name}-${originalIndex}`}
                        className="glass-card p-3 bg-secondary/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Player photo upload */}
                            <ImageUpload
                              currentUrl={playerPhotoUrl}
                              onUpload={async (file) => {
                                const path = getPlayerPhotoPath(selectedTeam.name, player.id);
                                const url = await uploadImage(file, path);
                                await setPlayerPhoto(selectedTeam.name, player.id, url);
                              }}
                              onRemove={async () => {
                                await removePlayerPhoto(selectedTeam.name, player.id);
                              }}
                              size="sm"
                              shape="circle"
                              placeholder={
                                <span className="text-xs font-bold">{player.id}</span>
                              }
                            />
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
                               onClick={() => startEditPlayer(player, occurrence)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                               onClick={() => setPlayerToDelete({ player, occurrence })}
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
                {/* Header with Add Team button */}
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar equipo..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                  <Button size="sm" onClick={() => setShowAddTeam(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir equipo
                  </Button>
                </div>

                {/* Add Team form */}
                {showAddTeam && (
                  <div className="glass-card p-4 bg-primary/5 border border-primary/20 space-y-3 mb-4">
                    <h4 className="font-semibold">Nuevo equipo</h4>
                    <div>
                      <Label className="text-xs">Nombre del equipo</Label>
                      <Input
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Ej: CD Valdivia Veteranos"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setShowAddTeam(false);
                          setNewTeamName('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={createTeam}
                        disabled={isSaving || !newTeamName.trim()}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Crear equipo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Teams list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTeams.map((team) => {
                    const shieldUrl = getTeamShield(team.name);
                    return (
                      <div
                        key={team.id}
                        className="glass-card p-4 hover:ring-1 hover:ring-primary/50 transition-all group relative"
                      >
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="flex items-center gap-3 w-full text-left"
                        >
                          {shieldUrl ? (
                            <img
                              src={shieldUrl}
                              alt={team.name}
                              className="w-12 h-12 rounded-xl object-contain bg-white/5"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {team.players?.length || 0} jugadores
                            </p>
                          </div>
                        </button>
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamToDelete(team);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
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
              <strong>{playerToDelete?.player?.alias || playerToDelete?.player?.name}</strong>?
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

      {/* Dedupe confirmation dialog */}
      <AlertDialog open={showDedupConfirm} onOpenChange={setShowDedupConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar jugadores duplicados?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {duplicateCount} entradas duplicadas (mismo dorsal, nombre y alias) dejando una sola.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedTeam) return;
                setIsSaving(true);
                try {
                  const teamRef = doc(db, 'teams', selectedTeam.id);
                  const teamSnap = await getDoc(teamRef);
                  if (!teamSnap.exists()) return;
                  const teamData = teamSnap.data();
                  const rawPlayers: Player[] = teamData.players || [];
                  const seen = new Set<string>();
                  const deduped = rawPlayers.filter((p) => {
                    const sig = playerSig(p);
                    if (seen.has(sig)) return false;
                    seen.add(sig);
                    return true;
                  });
                  deduped.sort((a, b) => {
                    const an = toNumeric(a.id);
                    const bn = toNumeric(b.id);
                    if (an !== bn) return an - bn;
                    return String(a.name).localeCompare(String(b.name));
                  });
                  await updateDoc(teamRef, { players: deduped });
                  setSelectedTeam({ ...selectedTeam, players: deduped });
                  onDataChange?.();
                } catch (e) {
                  console.error('Error deduplicating players:', e);
                  alert('Error al limpiar duplicados');
                } finally {
                  setIsSaving(false);
                  setShowDedupConfirm(false);
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete team confirmation dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el equipo{' '}
              <strong>{teamToDelete?.name}</strong>?
              Se eliminarán todos los jugadores asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteTeam}
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
