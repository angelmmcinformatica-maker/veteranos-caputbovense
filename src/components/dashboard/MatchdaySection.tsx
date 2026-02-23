import { Calendar, CheckCircle2, Radio } from 'lucide-react';
import { MatchCard } from '@/components/matches/MatchCard';
import type { Match, MatchReport } from '@/types/league';

interface MatchdaySectionProps {
  title: string;
  jornada: number;
  matches: Match[];
  rest: string | null;
  variant: 'live' | 'played' | 'upcoming';
  onMatchClick: (match: Match) => void;
  getMatchReport?: (match: Match) => MatchReport | null;
}

export function MatchdaySection({ title, jornada, matches, rest, variant, onMatchClick, getMatchReport }: MatchdaySectionProps) {
  const icon = variant === 'live' ? (
    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
  ) : variant === 'played' ? (
    <CheckCircle2 className="w-4 h-4 text-primary" />
  ) : (
    <Calendar className="w-4 h-4 text-primary" />
  );

  const badgeClass = variant === 'live'
    ? 'bg-red-500/20 text-red-400'
    : 'bg-secondary text-muted-foreground';

  const titleClass = variant === 'live' ? 'text-red-500' : '';

  return (
    <div className="glass-card p-3 sm:p-5 w-full overflow-hidden box-border">
      <div className="flex items-center justify-between mb-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className={`text-sm font-semibold ${titleClass}`}>{title}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${badgeClass}`}>
          Jornada {jornada}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2" style={{ minWidth: 0 }}>
        {matches.map((match, index) => (
          <MatchCard
            key={index}
            match={match}
            compact
            showTime
            onClick={() => onMatchClick(match)}
            hasReport={getMatchReport ? !!getMatchReport(match) : false}
          />
        ))}
      </div>
      {rest && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Descansa: <span className="font-medium text-foreground">{rest}</span>
        </p>
      )}
    </div>
  );
}
