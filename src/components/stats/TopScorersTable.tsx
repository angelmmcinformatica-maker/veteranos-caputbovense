import { Target } from 'lucide-react';
import type { TopScorer } from '@/types/league';
import { cn } from '@/lib/utils';

interface TopScorersTableProps {
  scorers: TopScorer[];
  onPlayerClick?: (playerName: string, teamName: string) => void;
}

export function TopScorersTable({ scorers, onPlayerClick }: TopScorersTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <Target className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold">Goleadores</h3>
      </div>
      <div className="divide-y divide-white/5">
        {scorers.map((scorer, index) => (
          <button 
            key={`${scorer.name}-${scorer.team}`}
            onClick={() => onPlayerClick?.(scorer.name, scorer.team)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
          >
            <span className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              index === 0 && 'bg-yellow-500/20 text-yellow-400',
              index === 1 && 'bg-gray-400/20 text-gray-300',
              index === 2 && 'bg-orange-700/20 text-orange-500',
              index > 2 && 'bg-secondary text-muted-foreground'
            )}>
              {index + 1}
            </span>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-orange-400/60" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate hover:text-primary transition-colors">{scorer.name}</p>
              <p className="text-xs text-muted-foreground truncate">{scorer.team}</p>
            </div>
            
            <div className="text-right">
              <span className="text-xl font-bold text-orange-400">{scorer.goals}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
