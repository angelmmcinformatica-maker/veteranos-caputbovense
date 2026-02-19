import { Clock, CheckCircle2, Radio, FileText, Shield, AlertCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/types/league';
import { useTeamImages } from '@/hooks/useTeamImages';
import { useMatchStatus, formatElapsedMinutes } from '@/hooks/useMatchStatus';

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
  const { displayStatus, elapsedMinutes } = useMatchStatus(match);

  const isPlayed = displayStatus === 'PLAYED';
  const isLive = displayStatus === 'LIVE';
  const isPendingResult = displayStatus === 'PENDING_RESULT';
  const isPending = displayStatus === 'PENDING';
  const isPostponed = displayStatus === 'POSTPONED';

  const homeShield = getTeamShield(match.home);
  const awayShield = getTeamShield(match.away);


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
          compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'
        )}
      />
    ) : (
      <div className={cn(
        'rounded bg-secondary/50 flex items-center justify-center flex-shrink-0',
        compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'
      )}>
        <Shield className={cn('text-muted-foreground', compact ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-4 sm:h-4')} />
      </div>
    )
  );

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        'w-full rounded-lg transition-all text-left overflow-hidden box-border',
        compact ? 'p-2 sm:p-3 bg-secondary/50' : 'glass-card-hover p-3 sm:p-4',
        isLive && 'border-l-2 border-l-status-win',
        isPendingResult && 'border-l-2 border-l-warning',
        isPostponed && 'border-l-2 border-l-warning',
        onClick && 'cursor-pointer hover:ring-1 hover:ring-primary/50'
      )}
    >
      {/* Status badge */}
      <div className="flex justify-center mb-1.5 sm:mb-2">
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
          <span className="flex items-center gap-1 text-[10px] text-status-win font-medium">
            <Radio className="w-3 h-3 animate-pulse" />
            En juego
            {elapsedMinutes !== null && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-status-win/20 text-status-win font-bold">
                {formatElapsedMinutes(elapsedMinutes)}
              </span>
            )}
          </span>
        )}
        {isPendingResult && (
          <span className="flex items-center gap-1 text-[10px] text-warning font-medium">
            <AlertCircle className="w-3 h-3" />
            Finalizado - Resultado Pendiente
          </span>
        )}
        {isPostponed && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
            <Ban className="w-3 h-3" />
            APLAZADO
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

      {/* Match info - vertical on mobile, horizontal on sm+ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-2 min-w-0">
        {/* Mobile: vertical stack */}
        <div className="flex sm:hidden flex-col items-center gap-1 w-full min-w-0">
          {/* Home team */}
          <div className={cn(
            'flex items-center gap-1.5 w-full justify-center min-w-0',
            isPlayed && match.homeGoals > match.awayGoals && 'font-semibold'
          )}>
            <TeamShield url={homeShield} name={match.home} />
            {onTeamClick ? (
              <button
                onClick={(e) => handleTeamClick(e, match.home)}
                className={cn(
                  'text-center leading-snug hover:text-primary transition-colors truncate',
                  compact ? 'text-xs' : 'text-sm'
                )}
              >
                {match.home}
              </button>
            ) : (
              <p className={cn('text-center leading-snug truncate', compact ? 'text-xs' : 'text-sm')}>
                {match.home}
              </p>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center">
            {isPostponed ? (
              <span className="text-warning font-bold text-xs">APL</span>
            ) : (isPlayed || isLive || isPendingResult) ? (
              <div className="flex items-center gap-1">
                <span className={cn(
                  'font-bold tabular-nums text-base',
                  isPlayed && match.homeGoals > match.awayGoals && 'text-primary'
                )}>
                  {match.homeGoals}
                </span>
                <span className="text-muted-foreground text-sm">-</span>
                <span className={cn(
                  'font-bold tabular-nums text-base',
                  isPlayed && match.awayGoals > match.homeGoals && 'text-primary'
                )}>
                  {match.awayGoals}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">vs</span>
            )}
          </div>

          {/* Away team */}
          <div className={cn(
            'flex items-center gap-1.5 w-full justify-center min-w-0',
            isPlayed && match.awayGoals > match.homeGoals && 'font-semibold'
          )}>
            <TeamShield url={awayShield} name={match.away} />
            {onTeamClick ? (
              <button
                onClick={(e) => handleTeamClick(e, match.away)}
                className={cn(
                  'text-center leading-snug hover:text-primary transition-colors truncate',
                  compact ? 'text-xs' : 'text-sm'
                )}
              >
                {match.away}
              </button>
            ) : (
              <p className={cn('text-center leading-snug truncate', compact ? 'text-xs' : 'text-sm')}>
                {match.away}
              </p>
            )}
          </div>
        </div>

        {/* Desktop: horizontal layout (sm+) */}
        <div className="hidden sm:flex items-center justify-between gap-2 w-full">
          {/* Home team */}
          <div className={cn(
            'flex-1 flex items-center justify-end gap-2 min-w-0',
            isPlayed && match.homeGoals > match.awayGoals && 'font-semibold'
          )}>
            {onTeamClick ? (
              <button
                onClick={(e) => handleTeamClick(e, match.home)}
                className="text-right leading-snug hover:text-primary hover:underline transition-colors text-xs line-clamp-2 break-words"
              >
                {match.home}
              </button>
            ) : (
              <p className="text-right leading-snug text-xs line-clamp-2 break-words">
                {match.home}
              </p>
            )}
            <TeamShield url={homeShield} name={match.home} />
          </div>

          {/* Score */}
          <div className={cn(
            'flex items-center justify-center flex-shrink-0',
            compact ? 'min-w-[44px]' : 'min-w-[60px]'
          )}>
            {isPostponed ? (
              <span className="text-warning font-bold text-sm">APL</span>
            ) : (isPlayed || isLive || isPendingResult) ? (
              <div className="flex items-center gap-0.5">
                <span className={cn(
                  'font-bold tabular-nums',
                  compact ? 'text-base' : 'text-lg',
                  isPlayed && match.homeGoals > match.awayGoals && 'text-primary'
                )}>
                  {match.homeGoals}
                </span>
                <span className="text-muted-foreground text-sm">-</span>
                <span className={cn(
                  'font-bold tabular-nums',
                  compact ? 'text-base' : 'text-lg',
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
            'flex-1 flex items-center gap-2 min-w-0',
            isPlayed && match.awayGoals > match.homeGoals && 'font-semibold'
          )}>
            <TeamShield url={awayShield} name={match.away} />
            {onTeamClick ? (
              <button
                onClick={(e) => handleTeamClick(e, match.away)}
                className="text-left leading-snug hover:text-primary hover:underline transition-colors text-xs line-clamp-2 break-words"
              >
                {match.away}
              </button>
            ) : (
              <p className="text-left leading-snug text-xs line-clamp-2 break-words">
                {match.away}
              </p>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
