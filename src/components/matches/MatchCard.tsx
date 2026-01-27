import { Clock, CheckCircle2, Radio, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/league';

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  showTime?: boolean;
  onClick?: () => void;
  hasReport?: boolean;
}

export function MatchCard({ match, compact = false, showTime = false, onClick, hasReport = false }: MatchCardProps) {
  const isPlayed = match.status === 'PLAYED';
  const isLive = match.status === 'LIVE';
  const isPending = match.status === 'PENDING';

  const formatTeamName = (name: string) => {
    if (compact && name.length > 18) {
      return name.substring(0, 16) + '...';
    }
    return name;
  };

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        'w-full rounded-lg transition-all text-left',
        compact ? 'p-3 bg-secondary/50' : 'glass-card-hover p-4',
        isLive && 'border-l-2 border-l-green-500',
        onClick && 'cursor-pointer hover:ring-1 hover:ring-primary/50'
      )}
    >
      {/* Status badge */}
      <div className="flex justify-center mb-2">
        {isPlayed && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="w-3 h-3" />
            Finalizado
            {hasReport && (
              <FileText className="w-3 h-3 ml-1 text-primary" />
            )}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] text-primary animate-pulse">
            <Radio className="w-3 h-3" />
            En directo
          </span>
        )}
        {isPending && showTime && match.time && (
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <Clock className="w-3 h-3" />
            {match.time}
          </span>
        )}
        {isPending && !match.time && (
          <span className="text-[10px] text-muted-foreground">
            Pendiente
          </span>
        )}
      </div>

      {/* Match info */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className={cn(
          'flex-1 text-right min-w-0',
          isPlayed && match.homeGoals > match.awayGoals && 'font-semibold'
        )}>
          <p className={cn(
            'truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {formatTeamName(match.home)}
          </p>
        </div>

        {/* Score */}
        <div className={cn(
          'flex items-center justify-center gap-1 flex-shrink-0',
          compact ? 'min-w-[50px]' : 'min-w-[70px]'
        )}>
          {isPlayed || isLive ? (
            <div className="flex items-center gap-1">
              <span className={cn(
                'font-bold tabular-nums',
                compact ? 'text-lg' : 'text-xl',
                isPlayed && match.homeGoals > match.awayGoals && 'text-primary'
              )}>
                {match.homeGoals}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={cn(
                'font-bold tabular-nums',
                compact ? 'text-lg' : 'text-xl',
                isPlayed && match.awayGoals > match.homeGoals && 'text-primary'
              )}>
                {match.awayGoals}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className={cn(
          'flex-1 text-left min-w-0',
          isPlayed && match.awayGoals > match.homeGoals && 'font-semibold'
        )}>
          <p className={cn(
            'truncate',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {formatTeamName(match.away)}
          </p>
        </div>
      </div>
    </CardWrapper>
  );
}
