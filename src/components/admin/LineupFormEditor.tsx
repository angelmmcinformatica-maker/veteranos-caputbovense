import { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Player, MatchReportPlayer } from '@/types/league';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LineupFormEditorProps {
  teamName: string;
  teamRoster: Player[];
  players: MatchReportPlayer[];
  onPlayersChange: (players: MatchReportPlayer[]) => void;
}

const FORMATIONS = ['1-4-3-3', '1-4-4-2', '1-4-2-3-1', '1-3-5-2', '1-5-3-2', '1-5-4-1'];

export function LineupFormEditor({ teamName, teamRoster, players, onPlayersChange }: LineupFormEditorProps) {
  const [formation, setFormation] = useState('1-4-2-3-1');
  const [numSubstitutes, setNumSubstitutes] = useState(9);

  // Separate starters (first 11) and subs
  const starters = players.filter(p => p.isStarting);
  const substitutes = players.filter(p => !p.isStarting);

  // Create a map of slot index to player for starters
  const starterSlots: (MatchReportPlayer | null)[] = Array(11).fill(null);
  starters.forEach((player, index) => {
    if (index < 11) starterSlots[index] = player;
  });

  // Create substitute slots
  const subSlots: (MatchReportPlayer | null)[] = Array(numSubstitutes).fill(null);
  substitutes.forEach((player, index) => {
    if (index < numSubstitutes) subSlots[index] = player;
  });

  const getAvailablePlayers = (excludeSlotPlayer?: MatchReportPlayer | null) => {
    const usedIds = players
      .filter(p => excludeSlotPlayer ? p.id !== excludeSlotPlayer.id : true)
      .map(p => p.id);
    return teamRoster.filter(p => !usedIds.includes(p.id));
  };

  const handlePlayerSelect = (slotIndex: number, isStarter: boolean, playerId: string) => {
    if (playerId === 'none') {
      // Remove player from this slot
      const targetPlayer = isStarter ? starterSlots[slotIndex] : subSlots[slotIndex];
      if (targetPlayer) {
        onPlayersChange(players.filter(p => p.id !== targetPlayer.id));
      }
      return;
    }

    const selectedRosterPlayer = teamRoster.find(p => String(p.id) === playerId);
    if (!selectedRosterPlayer) return;

    // Check if we need to replace an existing player in this slot
    const currentSlotPlayer = isStarter ? starterSlots[slotIndex] : subSlots[slotIndex];
    
    const newPlayer: MatchReportPlayer = {
      id: selectedRosterPlayer.id,
      name: selectedRosterPlayer.name,
      alias: selectedRosterPlayer.alias || undefined,
      matchNumber: selectedRosterPlayer.id,
      isStarting: isStarter,
      substitutionMin: '',
      goals: 0,
      yellowCards: 0,
      redCards: 0,
      directRedCards: 0
    };

    let updatedPlayers: MatchReportPlayer[];
    
    if (currentSlotPlayer) {
      // Replace existing player in slot
      updatedPlayers = players.map(p => 
        p.id === currentSlotPlayer.id ? newPlayer : p
      );
    } else {
      // Add new player
      updatedPlayers = [...players, newPlayer];
    }

    onPlayersChange(updatedPlayers);
  };

  const updatePlayerStat = (playerId: number | string, field: keyof MatchReportPlayer, value: any) => {
    onPlayersChange(
      players.map(p => p.id === playerId ? { ...p, [field]: value } : p)
    );
  };

  const PlayerSlot = ({ 
    index, 
    player, 
    isStarter,
    label 
  }: { 
    index: number; 
    player: MatchReportPlayer | null;
    isStarter: boolean;
    label: string;
  }) => {
    const availablePlayers = getAvailablePlayers(player);
    
    return (
      <div className="glass-card p-3 bg-secondary/30 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}.</span>
          <Select
            value={player ? String(player.id) : 'none'}
            onValueChange={(value) => handlePlayerSelect(index, isStarter, value)}
          >
            <SelectTrigger className="flex-1 bg-secondary/50">
              <SelectValue placeholder={`-- ${label} --`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="none">-- {label} --</SelectItem>
              {player && (
                <SelectItem value={String(player.id)}>
                  {player.matchNumber} - {player.name} {player.alias ? `(${player.alias})` : ''}
                </SelectItem>
              )}
              {availablePlayers.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.id} - {p.name} {p.alias ? `(${p.alias})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats row - only show if player selected */}
        {player && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Dorsal */}
            <div>
              <Label className="text-xs text-muted-foreground">Nº</Label>
              <div className="mt-1 px-2 py-1 rounded bg-secondary/50 text-sm font-medium">
                {player.matchNumber}
              </div>
            </div>

            {/* Goals */}
            <div>
              <Label className="text-xs text-muted-foreground">Goles</Label>
              <div className="mt-1 flex items-center justify-center gap-1">
                <button
                  onClick={() => updatePlayerStat(player.id, 'goals', Math.max(0, player.goals - 1))}
                  className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold">{player.goals}</span>
                <button
                  onClick={() => updatePlayerStat(player.id, 'goals', player.goals + 1)}
                  className="w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div>
              <Label className="text-xs text-muted-foreground">Tarjetas</Label>
              <Select
                value={
                  player.directRedCards > 0 ? 'red' :
                  player.yellowCards >= 2 ? 'double-yellow' :
                  player.yellowCards === 1 ? 'yellow' : 'none'
                }
                onValueChange={(value) => {
                  if (value === 'none') {
                    updatePlayerStat(player.id, 'yellowCards', 0);
                    updatePlayerStat(player.id, 'directRedCards', 0);
                  } else if (value === 'yellow') {
                    updatePlayerStat(player.id, 'yellowCards', 1);
                    updatePlayerStat(player.id, 'directRedCards', 0);
                  } else if (value === 'double-yellow') {
                    updatePlayerStat(player.id, 'yellowCards', 2);
                    updatePlayerStat(player.id, 'directRedCards', 0);
                  } else if (value === 'red') {
                    updatePlayerStat(player.id, 'yellowCards', 0);
                    updatePlayerStat(player.id, 'directRedCards', 1);
                  }
                }}
              >
                <SelectTrigger className="mt-1 h-7 bg-secondary/50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin</SelectItem>
                  <SelectItem value="yellow">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-3 bg-warning rounded-sm" /> Amarilla
                    </span>
                  </SelectItem>
                  <SelectItem value="double-yellow">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-3 bg-warning rounded-sm" />
                      <span className="w-2 h-3 bg-warning rounded-sm" /> Doble
                    </span>
                  </SelectItem>
                  <SelectItem value="red">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-3 bg-destructive rounded-sm" /> Roja
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Substitution minute */}
            <div>
              <Label className="text-xs text-muted-foreground">
                {isStarter ? 'Min Sust.' : 'Entra'}
              </Label>
              <Input
                value={player.substitutionMin}
                onChange={(e) => updatePlayerStat(player.id, 'substitutionMin', e.target.value)}
                placeholder={isStarter ? "Ej: 65'" : "Ej: 60'"}
                className="mt-1 h-7 text-xs px-2 bg-secondary/50"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Team name */}
      <h3 className="text-lg font-bold text-center">{teamName}</h3>

      {/* Formation selector */}
      <div className="glass-card p-3 bg-primary/10 border border-primary/30">
        <Label className="text-xs text-primary font-semibold uppercase">Táctica por defecto</Label>
        <Select value={formation} onValueChange={setFormation}>
          <SelectTrigger className="mt-2 bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATIONS.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Starters (11) */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm uppercase tracking-wide">
          Titulares (11)
        </h4>
        <div className="space-y-2">
          {starterSlots.map((player, index) => (
            <PlayerSlot
              key={`starter-${index}`}
              index={index}
              player={player}
              isStarter={true}
              label="Titular"
            />
          ))}
        </div>
      </div>

      {/* Substitutes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm uppercase tracking-wide">
            Suplentes ({numSubstitutes})
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNumSubstitutes(Math.max(0, numSubstitutes - 1))}
              className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setNumSubstitutes(numSubstitutes + 1)}
              className="w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {subSlots.map((player, index) => (
            <PlayerSlot
              key={`sub-${index}`}
              index={index}
              player={player}
              isStarter={false}
              label="Suplente"
            />
          ))}
        </div>
      </div>

      {/* Quick summary */}
      <div className="glass-card p-3 bg-secondary/30 text-center">
        <div className="flex items-center justify-around">
          <div>
            <p className="text-xl font-bold text-primary">
              {players.reduce((acc, p) => acc + p.goals, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Goles</p>
          </div>
          <div>
            <p className="text-xl font-bold text-warning">
              {players.reduce((acc, p) => acc + p.yellowCards, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Amarillas</p>
          </div>
          <div>
            <p className="text-xl font-bold text-destructive">
              {players.reduce((acc, p) => acc + (p.redCards || 0) + (p.directRedCards || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Rojas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
