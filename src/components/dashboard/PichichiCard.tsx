import { Target, Flame } from 'lucide-react';
import type { TopScorer } from '@/types/league';

interface PichichiCardProps {
  pichichi: TopScorer | null;
}

export function PichichiCard({ pichichi }: PichichiCardProps) {
  if (!pichichi) return null;

  return (
    <div className="glass-card-hover p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-500">Pichichi</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Avatar placeholder */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-500/30 flex items-center justify-center">
            <Target className="w-6 h-6 text-orange-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">{pichichi.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{pichichi.team}</p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-400">{pichichi.goals}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Goles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
