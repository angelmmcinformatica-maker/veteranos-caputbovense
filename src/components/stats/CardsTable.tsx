import { AlertTriangle, User } from 'lucide-react';
import type { CardRanking } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';

interface CardsTableProps {
  players: CardRanking[];
  onPlayerClick?: (playerName: string, teamName: string) => void;
}

export function CardsTable({ players, onPlayerClick }: CardsTableProps) {
  const { getPlayerPhoto } = useTeamImages();

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold">Tarjetas</h3>
      </div>
      <div className="divide-y divide-white/5">
        {players.map((player, index) => {
          const photoUrl = getPlayerPhoto(player.team, player.playerId || player.name);
          return (
            <button 
              key={`${player.name}-${player.team}`}
              onClick={() => onPlayerClick?.(player.name, player.team)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
            >
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                {index + 1}
              </span>

              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover border border-yellow-500/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-yellow-400/60" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate hover:text-primary transition-colors">{player.name}</p>
                <p className="text-xs text-muted-foreground truncate">{player.team}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-5 rounded-sm bg-warning" />
                  <span className="text-sm font-medium">{player.yellowCards}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-5 rounded-sm bg-destructive" />
                  <span className="text-sm font-medium">{player.redCards}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
