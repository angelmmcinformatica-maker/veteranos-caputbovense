import { Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MatchReportPlayer, Player } from '@/types/league';

interface LineupPlayerSlotProps {
  index: number;
  label: string;
  isStarter: boolean;
  player: MatchReportPlayer | null;
  teamRoster: Player[];
  usedPlayerIds: Array<string | number>;
  onSelectPlayer: (slotIndex: number, isStarter: boolean, playerId: string) => void;
  onPatchPlayer: (playerId: string | number, patch: Partial<MatchReportPlayer>) => void;
}

const toNumeric = (v: string | number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

export function LineupPlayerSlot({
  index,
  label,
  isStarter,
  player,
  teamRoster,
  usedPlayerIds,
  onSelectPlayer,
  onPatchPlayer,
}: LineupPlayerSlotProps) {
  const availablePlayers = teamRoster
    .filter((p) => {
      if (player && p.id === player.id) return true;
      return !usedPlayerIds.includes(p.id);
    })
    .sort((a, b) => {
      const an = toNumeric(a.id);
      const bn = toNumeric(b.id);
      if (an !== bn) return an - bn;
      return String(a.name).localeCompare(String(b.name));
    });

  const cardValue =
    (player?.directRedCards || 0) > 0
      ? 'red'
      : (player?.yellowCards || 0) >= 2
        ? 'double-yellow'
        : (player?.yellowCards || 0) === 1
          ? 'yellow'
          : 'none';

  return (
    <div className="glass-card p-3 bg-secondary/30 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}.</span>
        <Select value={player ? String(player.id) : 'none'} onValueChange={(v) => onSelectPlayer(index, isStarter, v)}>
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
            {availablePlayers.map((p, optIndex) => (
              <SelectItem key={`${p.id}-${p.name}-${optIndex}`} value={String(p.id)}>
                {p.id} - {p.name} {p.alias ? `(${p.alias})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {player && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <Label className="text-xs text-muted-foreground">Nº</Label>
            <div className="mt-1 px-2 py-1 rounded bg-secondary/50 text-sm font-medium">{player.matchNumber}</div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Goles</Label>
            <div className="mt-1 flex items-center justify-center gap-1">
              <button
                onClick={() => onPatchPlayer(player.id, { goals: Math.max(0, (player.goals || 0) - 1) })}
                className="w-6 h-6 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center"
                type="button"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-bold">{player.goals || 0}</span>
              <button
                onClick={() => onPatchPlayer(player.id, { goals: (player.goals || 0) + 1 })}
                className="w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                type="button"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tarjetas</Label>
            <Select
              value={cardValue}
              onValueChange={(value) => {
                if (!player) return;
                if (value === 'none') {
                  onPatchPlayer(player.id, { yellowCards: 0, directRedCards: 0, redCards: 0 });
                } else if (value === 'yellow') {
                  onPatchPlayer(player.id, { yellowCards: 1, directRedCards: 0, redCards: 0 });
                } else if (value === 'double-yellow') {
                  onPatchPlayer(player.id, { yellowCards: 2, directRedCards: 0, redCards: 0 });
                } else if (value === 'red') {
                  onPatchPlayer(player.id, { yellowCards: 0, directRedCards: 1, redCards: 0 });
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

          <div>
            <Label className="text-xs text-muted-foreground">{isStarter ? 'Min Sust.' : 'Entra'}</Label>
            <Input
              value={player.substitutionMin || ''}
              onChange={(e) => onPatchPlayer(player.id, { substitutionMin: e.target.value })}
              placeholder={isStarter ? "Ej: 65'" : "Ej: 60'"}
              className="mt-1 h-7 text-xs px-2 bg-secondary/50"
              inputMode="numeric"
            />
          </div>
        </div>
      )}
    </div>
  );
}
