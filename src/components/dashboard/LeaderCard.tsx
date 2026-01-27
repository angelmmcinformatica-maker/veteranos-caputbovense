import { Crown, TrendingUp } from 'lucide-react';
import type { TeamStanding } from '@/types/league';

interface LeaderCardProps {
  leader: TeamStanding | null;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  if (!leader) return null;

  return (
    <div className="glass-card-hover p-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-yellow-500">Líder</span>
        </div>
        
        <h3 className="text-xl font-bold truncate mb-1">{leader.team}</h3>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="text-center">
            <p className="stat-value text-3xl">{leader.points}</p>
            <p className="text-xs text-muted-foreground mt-0.5">PTS</p>
          </div>
          
          <div className="h-10 w-px bg-border" />
          
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-green-400">{leader.won}</p>
              <p className="text-[10px] text-muted-foreground">V</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">{leader.drawn}</p>
              <p className="text-[10px] text-muted-foreground">E</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{leader.lost}</p>
              <p className="text-[10px] text-muted-foreground">D</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            +{leader.goalDifference} diferencia de goles
          </span>
        </div>
      </div>
    </div>
  );
}
