import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { Matchday } from '@/types/league';
import { MatchCard } from '../matches/MatchCard';

interface MatchdayPreviewProps {
  title: string;
  matchday: Matchday | null;
  showTime?: boolean;
}

export function MatchdayPreview({ title, matchday, showTime = false }: MatchdayPreviewProps) {
  if (!matchday) return null;

  const isPlayed = matchday.matches?.every(m => m.status === 'PLAYED');
  const displayMatches = matchday.matches?.slice(0, 4) || [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isPlayed ? (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : (
            <Calendar className="w-4 h-4 text-primary" />
          )}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          Jornada {matchday.jornada}
        </span>
      </div>

      <div className="space-y-3">
        {displayMatches.map((match, index) => (
          <MatchCard key={index} match={match} compact showTime={showTime} />
        ))}
      </div>

      {matchday.matches && matchday.matches.length > 4 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          +{matchday.matches.length - 4} partidos más
        </p>
      )}
    </div>
  );
}
