import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MatchCard } from '@/components/matches/MatchCard';
import type { Matchday } from '@/types/league';
import { cn } from '@/lib/utils';

interface MatchesViewProps {
  matchdays: Matchday[];
}

export function MatchesView({ matchdays }: MatchesViewProps) {
  const [selectedJornada, setSelectedJornada] = useState<number>(() => {
    // Find the first matchday with pending matches or the last one
    const pendingMatchday = matchdays.find(md => 
      md.matches?.some(m => m.status === 'PENDING')
    );
    return pendingMatchday?.jornada || matchdays[matchdays.length - 1]?.jornada || 1;
  });

  const selectedMatchday = matchdays.find(md => md.jornada === selectedJornada);
  const maxJornada = Math.max(...matchdays.map(md => md.jornada), 1);

  const handlePrev = () => {
    if (selectedJornada > 1) {
      setSelectedJornada(selectedJornada - 1);
    }
  };

  const handleNext = () => {
    if (selectedJornada < maxJornada) {
      setSelectedJornada(selectedJornada + 1);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Partidos</h2>
        <p className="text-sm text-muted-foreground">Calendario de la temporada</p>
      </div>

      {/* Jornada selector */}
      <div className="glass-card p-3 mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={selectedJornada <= 1}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              selectedJornada <= 1 
                ? 'text-muted-foreground/30 cursor-not-allowed' 
                : 'text-foreground hover:bg-secondary'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">Jornada {selectedJornada}</span>
            {selectedMatchday?.date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {selectedMatchday.date}
              </span>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedJornada >= maxJornada}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              selectedJornada >= maxJornada
                ? 'text-muted-foreground/30 cursor-not-allowed' 
                : 'text-foreground hover:bg-secondary'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick jornada selector */}
        <div className="flex gap-1 mt-3 overflow-x-auto hide-scrollbar pb-1">
          {matchdays.map(md => (
            <button
              key={md.jornada}
              onClick={() => setSelectedJornada(md.jornada)}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg text-xs font-medium transition-all',
                selectedJornada === md.jornada
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {md.jornada}
            </button>
          ))}
        </div>
      </div>

      {/* Matches list */}
      {selectedMatchday?.matches && selectedMatchday.matches.length > 0 ? (
        <div className="space-y-3">
          {selectedMatchday.matches.map((match, index) => (
            <MatchCard key={index} match={match} showTime />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No hay partidos para esta jornada</p>
        </div>
      )}

      {/* Rest team indicator */}
      {selectedMatchday?.rest && (
        <div className="glass-card p-4 mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Descansa: <span className="font-medium text-foreground">{selectedMatchday.rest}</span>
          </p>
        </div>
      )}
    </div>
  );
}
