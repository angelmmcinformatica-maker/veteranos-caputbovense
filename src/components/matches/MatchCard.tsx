import { Clock, CheckCircle2, Radio, FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  showTime?: boolean;
  onClick?: () => void;
  hasReport?: boolean;
  onTeamClick?: (teamName: string) => void;
}

export function MatchCard({ match, compact = false, showTime = false, onClick, hasReport = false, onTeamClick }: MatchCardProps) {
  const { getTeamShield } = useTeamImages();
  const isPlayed = match.status === 'PLAYED';
  const isLive = match.status === 'LIVE';
  const isPending = match.status === 'PENDING' || match.status === 'SCHEDULED';

  const homeShield = getTeamShield(match.home);
  const awayShield = getTeamShield(match.away);

  const formatTeamName = (name: string) => {
    if (compact && name.length > 18) {
      return name.substring(0, 16) + '...';
    }
    return name;
  };

  const handleTeamClick = (e: React.MouseEvent, teamName: string) => {
    if (onTeamClick) {
      e.stopPropagation();
      onTeamClick(teamName);
    }
  };

  const CardWrapper = onClick ? 'button' : 'div';

  const TeamShield = ({ url, name }: { url?: string; name: string }) => (
    url ? (
      <img
        src={url}
        alt={name}
        className={cn(
          'object-contain rounded flex-shrink-0',
          compact ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'
        )}
      />
    ) : (
      <div className={cn(
        'rounded bg-secondary/50 flex items-center justify-center flex-shrink-0',
        compact ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'
      )}>
        <Shield className={cn('text-muted-foreground', compact ? 'w-3 h-3' : 'w-4 h-4')} />
      </div>
    )
  );

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
        {isPending && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {match.date && <span>{match.date}</span>}
            {match.date && match.time && <span>•</span>}
            {match.time ? (
              <span className="text-primary">{match.time}</span>
            ) : (
              <span>Hora por confirmar</span>
            )}
          </span>
        )}
      </div>

      {/* Match info */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className={cn(
          'flex-1 flex items-center justify-end gap-1 sm:gap-2 min-w-0',
          isPlayed && match.homeGoals > match.awayGoals && 'font-semibold'
        )}>
          {onTeamClick ? (
            <button
              onClick={(e) => handleTeamClick(e, match.home)}
              className={cn(
                'text-right leading-tight hover:text-primary hover:underline transition-colors line-clamp-2',
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              )}
            >
              {formatTeamName(match.home)}
            </button>
          ) : (
            <p className={cn('text-right leading-tight line-clamp-2', compact ? 'text-xs' : 'text-xs sm:text-sm')}>
              {formatTeamName(match.home)}
            </p>
          )}
          <TeamShield url={homeShield} name={match.home} />
        </div>

        {/* Score */}
        <div className={cn(
          'flex items-center justify-center gap-0.5 sm:gap-1 flex-shrink-0 px-1',
          compact ? 'min-w-[40px]' : 'min-w-[50px] sm:min-w-[70px]'
        )}>
          {isPlayed || isLive ? (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className={cn(
                'font-bold tabular-nums',
                compact ? 'text-base' : 'text-lg sm:text-xl',
                isPlayed && match.homeGoals > match.awayGoals && 'text-primary'
              )}>
                {match.homeGoals}
              </span>
              <span className="text-muted-foreground text-sm">-</span>
              <span className={cn(
                'font-bold tabular-nums',
                compact ? 'text-base' : 'text-lg sm:text-xl',
                isPlayed && match.awayGoals > match.homeGoals && 'text-primary'
              )}>
                {match.awayGoals}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs sm:text-sm">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className={cn(
          'flex-1 flex items-center gap-1 sm:gap-2 min-w-0',
          isPlayed && match.awayGoals > match.homeGoals && 'font-semibold'
        )}>
          <TeamShield url={awayShield} name={match.away} />
          {onTeamClick ? (
            <button
              onClick={(e) => handleTeamClick(e, match.away)}
              className={cn(
                'text-left leading-tight hover:text-primary hover:underline transition-colors line-clamp-2',
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              )}
            >
              {formatTeamName(match.away)}
            </button>
          ) : (
            <p className={cn('text-left leading-tight line-clamp-2', compact ? 'text-xs' : 'text-xs sm:text-sm')}>
              {formatTeamName(match.away)}
            </p>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
