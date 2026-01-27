import { AlertTriangle } from 'lucide-react';
import type { CardRanking } from '@/types/league';
import { cn } from '@/lib/utils';

interface CardsTableProps {
  players: CardRanking[];
}

export function CardsTable({ players }: CardsTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold">Tarjetas</h3>
      </div>
      <div className="divide-y divide-white/5">
        {players.map((player, index) => (
          <div 
            key={`${player.name}-${player.team}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
              {index + 1}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{player.name}</p>
              <p className="text-xs text-muted-foreground truncate">{player.team}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-4 h-5 rounded-sm bg-yellow-500" />
                <span className="text-sm font-medium">{player.yellowCards}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-5 rounded-sm bg-red-500" />
                <span className="text-sm font-medium">{player.redCards}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
