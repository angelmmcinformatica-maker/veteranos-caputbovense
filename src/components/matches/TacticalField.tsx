import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MatchReportPlayer } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';

interface TacticalFieldProps {
  teamName: string;
  formation: string;
  players: MatchReportPlayer[];
  homeTeamPlayers?: { id: string | number; name: string }[];
  className?: string;
}

// Formation positions mapping (from right to left as per user request)
// Each position is [row (0-4 bottom to top), column (0-10 left to right)]
const FORMATION_POSITIONS: Record<string, number[][]> = {
  '1-4-4-2': [
    // GK
    [0, 5],
    // Defense (RB, RCB, LCB, LB) - right to left
    [1, 9], [1, 6.5], [1, 3.5], [1, 1],
    // Midfield (RM, RCM, LCM, LM)
    [2.5, 9], [2.5, 6.5], [2.5, 3.5], [2.5, 1],
    // Attack (RS, LS)
    [4, 6.5], [4, 3.5]
  ],
  '1-4-3-3': [
    [0, 5],
    [1, 9], [1, 6.5], [1, 3.5], [1, 1],
    [2.2, 7], [2.2, 5], [2.2, 3],
    [4, 8], [4, 5], [4, 2]
  ],
  '1-4-2-3-1': [
    [0, 5],
    [1, 9], [1, 6.5], [1, 3.5], [1, 1],
    [2, 6.5], [2, 3.5],
    [3, 8], [3, 5], [3, 2],
    [4, 5]
  ],
  '1-3-5-2': [
    [0, 5],
    [1, 7], [1, 5], [1, 3],
    [2.3, 9], [2.3, 7], [2.3, 5], [2.3, 3], [2.3, 1],
    [4, 6.5], [4, 3.5]
  ],
  '1-5-3-2': [
    [0, 5],
    [1, 9], [1, 7], [1, 5], [1, 3], [1, 1],
    [2.5, 7], [2.5, 5], [2.5, 3],
    [4, 6.5], [4, 3.5]
  ],
  '1-5-4-1': [
    [0, 5],
    [1, 9], [1, 7], [1, 5], [1, 3], [1, 1],
    [2.5, 8], [2.5, 6], [2.5, 4], [2.5, 2],
    [4, 5]
  ]
};

export function TacticalField({ teamName, formation, players, homeTeamPlayers, className }: TacticalFieldProps) {
  const { getPlayerPhoto } = useTeamImages();
  
  const starters = useMemo(() => 
    players
      .filter(p => p.isStarting)
      .sort((a, b) => {
        const numA = typeof a.matchNumber === 'number' ? a.matchNumber : parseInt(String(a.matchNumber)) || 0;
        const numB = typeof b.matchNumber === 'number' ? b.matchNumber : parseInt(String(b.matchNumber)) || 0;
        return numA - numB;
      })
      .slice(0, 11),
    [players]
  );

  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['1-4-4-2'];

  const getPlayerId = (playerName: string): string | number | undefined => {
    const player = homeTeamPlayers?.find(p => p.name === playerName);
    return player?.id;
  };

  return (
    <div className={cn("relative w-full aspect-[3/4] bg-gradient-to-b from-primary/80 to-primary/60 rounded-xl overflow-hidden border-2 border-primary/30", className)}>
      {/* Field markings */}
      <div className="absolute inset-0">
        {/* Field border */}
        <div className="absolute inset-2 border-2 border-primary-foreground/40 rounded-lg" />
        
        {/* Center line */}
        <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-primary-foreground/40" />
        
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-primary-foreground/40 rounded-full" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary-foreground/40 rounded-full" />
        
        {/* Bottom penalty area (our goal) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-primary-foreground/40 border-b-0 rounded-t-lg" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-5 border-2 border-primary-foreground/40 border-b-0 rounded-t" />
        
        {/* Top penalty area (opponent goal) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-primary-foreground/40 border-t-0 rounded-b-lg" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 border-2 border-primary-foreground/40 border-t-0 rounded-b" />
      </div>

      {/* Players */}
      <div className="absolute inset-4">
        {starters.map((player, index) => {
          const pos = positions[index];
          if (!pos) return null;

          const playerId = getPlayerId(player.name);
          const photoUrl = playerId ? getPlayerPhoto(teamName, playerId) : undefined;
          
          // Convert position to percentage (row 0 = bottom, row 4 = top)
          const top = 100 - (pos[0] / 4.5 * 85 + 7.5);
          const left = pos[1] / 10 * 100;

          return (
            <div
              key={player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
              style={{ top: `${top}%`, left: `${left}%` }}
            >
              {/* Player circle */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background shadow-lg flex items-center justify-center overflow-hidden ring-2 ring-background/50">
                {photoUrl ? (
                  <img src={photoUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-primary">
                    {player.matchNumber}
                  </span>
                )}
              </div>
              {/* Player name */}
              <div className="bg-secondary/90 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-medium text-foreground whitespace-nowrap max-w-[60px] truncate">
                {player.alias || player.name.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formation label */}
      <div className="absolute top-2 left-2 bg-secondary/80 px-2 py-1 rounded text-xs font-bold text-foreground">
        {formation}
      </div>
    </div>
  );
}
