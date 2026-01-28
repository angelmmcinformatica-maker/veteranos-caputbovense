import { useState } from 'react';
import { Plus, UserPlus, User, Goal, Minus, ArrowRightLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Player, MatchReportPlayer } from '@/types/league';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LineupEditorProps {
  teamName: string;
  teamRoster: Player[];
  players: MatchReportPlayer[];
  onPlayersChange: (players: MatchReportPlayer[]) => void;
}

export function LineupEditor({ teamName, teamRoster, players, onPlayersChange }: LineupEditorProps) {
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const startingPlayers = players.filter(p => p.isStarting);
  const substitutePlayers = players.filter(p => !p.isStarting);

  // Get players not yet in lineup
  const availablePlayers = teamRoster.filter(
    rosterPlayer => !players.some(p => p.id === rosterPlayer.id)
  );

  const addPlayerToLineup = (player: Player, isStarting: boolean) => {
    const newPlayer: MatchReportPlayer = {
      id: player.id,
      name: player.name,
      alias: player.alias || undefined,
      matchNumber: player.id,
      isStarting,
      substitutionMin: '',
      goals: 0,
      yellowCards: 0,
      redCards: 0,
      directRedCards: 0
    };
    onPlayersChange([...players, newPlayer]);
  };

  const removePlayer = (playerId: number | string) => {
    onPlayersChange(players.filter(p => p.id !== playerId));
  };

  const updatePlayer = (playerId: number | string, updates: Partial<MatchReportPlayer>) => {
    onPlayersChange(
      players.map(p => p.id === playerId ? { ...p, ...updates } : p)
    );
  };

  const toggleStarting = (playerId: number | string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    if (player.isStarting) {
      // Moving to substitutes - keep in list but mark as substitute
      updatePlayer(playerId, { isStarting: false });
    } else {
      // Moving to starters - check if we have less than 11
      if (startingPlayers.length < 11) {
        updatePlayer(playerId, { isStarting: true, substitutionMin: '' });
      } else {
        alert('Ya hay 11 titulares. Quita uno primero.');
      }
    }
  };

  const PlayerCard = ({ player, showControls = true }: { player: MatchReportPlayer; showControls?: boolean }) => (
    <div className={cn(
      'p-3 rounded-lg border transition-all',
      player.isStarting 
        ? 'bg-primary/10 border-primary/30' 
        : 'bg-secondary/50 border-border'
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
            player.isStarting ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          )}>
            {player.matchNumber}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {player.alias || player.name}
            </p>
            {player.alias && (
              <p className="text-xs text-muted-foreground truncate">{player.name}</p>
            )}
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => toggleStarting(player.id)}
              className={cn(
                'p-1.5 rounded transition-colors',
                player.isStarting 
                  ? 'bg-secondary hover:bg-secondary/80 text-muted-foreground' 
                  : 'bg-primary/20 hover:bg-primary/30 text-primary'
              )}
              title={player.isStarting ? 'Mover a suplentes' : 'Mover a titulares'}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => removePlayer(player.id)}
              className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              title="Quitar del acta"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Player stats controls */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {/* Goals */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Goles</Label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updatePlayer(player.id, { goals: Math.max(0, player.goals - 1) })}
              className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-primary">{player.goals}</span>
            <button
              onClick={() => updatePlayer(player.id, { goals: player.goals + 1 })}
              className="w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Yellow cards */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Amarilla</Label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updatePlayer(player.id, { yellowCards: Math.max(0, player.yellowCards - 1) })}
              className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center">
              <span className={cn(
                'inline-block w-3 h-4 rounded-sm',
                player.yellowCards > 0 ? 'bg-warning' : 'bg-muted'
              )} />
            </span>
            <button
              onClick={() => updatePlayer(player.id, { yellowCards: Math.min(2, player.yellowCards + 1) })}
              className="w-6 h-6 rounded bg-warning text-warning-foreground hover:bg-warning/90 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Red cards */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Roja</Label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updatePlayer(player.id, { directRedCards: Math.max(0, player.directRedCards - 1) })}
              className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center">
              <span className={cn(
                'inline-block w-3 h-4 rounded-sm',
                player.directRedCards > 0 ? 'bg-destructive' : 'bg-muted'
              )} />
            </span>
            <button
              onClick={() => updatePlayer(player.id, { directRedCards: player.directRedCards + 1 })}
              className="w-6 h-6 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Substitution minute (only for substitutes) */}
        {!player.isStarting && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Min.</Label>
            <Input
              value={player.substitutionMin}
              onChange={(e) => updatePlayer(player.id, { substitutionMin: e.target.value })}
              placeholder="0'"
              className="h-6 text-xs px-2"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{teamName}</h3>
          <p className="text-sm text-muted-foreground">
            {startingPlayers.length}/11 titulares • {substitutePlayers.length} suplentes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddPlayer(!showAddPlayer)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Añadir jugador
        </Button>
      </div>

      {/* Add player section */}
      {showAddPlayer && (
        <div className="glass-card p-4 bg-secondary/30 space-y-3">
          <Label>Seleccionar jugador de la plantilla</Label>
          {availablePlayers.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availablePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => {
                    addPlayerToLineup(player, startingPlayers.length < 11);
                    setShowAddPlayer(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-left transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    {player.id}
                  </div>
                  <span className="text-sm truncate">{player.alias || player.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Todos los jugadores ya están en el acta
            </p>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowAddPlayer(false)} className="w-full">
            Cancelar
          </Button>
        </div>
      )}

      {/* Starting 11 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <Label className="text-sm font-semibold">
            Titulares ({startingPlayers.length}/11)
          </Label>
        </div>
        {startingPlayers.length > 0 ? (
          <div className="grid gap-2">
            {startingPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Añade jugadores a los titulares
            </p>
          </div>
        )}
      </div>

      {/* Substitutes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <Label className="text-sm font-semibold">
            Suplentes ({substitutePlayers.length})
          </Label>
        </div>
        {substitutePlayers.length > 0 ? (
          <div className="grid gap-2">
            {substitutePlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">
              Sin suplentes añadidos
            </p>
          </div>
        )}
      </div>

      {/* Quick stats summary */}
      {players.length > 0 && (
        <div className="glass-card p-3 bg-secondary/30">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {players.reduce((acc, p) => acc + p.goals, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Goles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {players.reduce((acc, p) => acc + p.yellowCards, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Amarillas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">
                {players.reduce((acc, p) => acc + (p.redCards || 0) + (p.directRedCards || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Rojas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
