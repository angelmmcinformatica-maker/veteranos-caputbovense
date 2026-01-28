import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MatchCard } from '@/components/matches/MatchCard';
import { MatchDetailModal } from '@/components/matches/MatchDetailModal';
import type { Matchday, Match, MatchReport, Team } from '@/types/league';
import { cn } from '@/lib/utils';

interface MatchesViewProps {
  matchdays: Matchday[];
  matchReports: MatchReport[];
  teams: Team[];
  onTeamClick?: (teamName: string) => void;
  onPlayerClick?: (playerName: string, teamName: string) => void;
}

export function MatchesView({ matchdays, matchReports, teams, onTeamClick, onPlayerClick }: MatchesViewProps) {
  const [selectedJornada, setSelectedJornada] = useState<number>(() => {
    // PRIORITY 1: Find matchday with LIVE matches first
    const liveMatchday = matchdays.find(md => 
      md.matches?.some(m => m.status === 'LIVE')
    );
    if (liveMatchday) return liveMatchday.jornada;
    
    // PRIORITY 2: Find the last matchday with played matches
    const playedMatchdays = matchdays.filter(md => 
      md.matches?.some(m => m.status === 'PLAYED')
    );
    return playedMatchdays[playedMatchdays.length - 1]?.jornada || matchdays[0]?.jornada || 1;
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

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

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
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
            <MatchCard 
              key={index} 
              match={match} 
              showTime 
              onClick={() => setSelectedMatch(match)}
              hasReport={!!getMatchReport(match)}
              onTeamClick={onTeamClick}
            />
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

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          matchReport={getMatchReport(selectedMatch)}
          teams={teams}
          onClose={() => setSelectedMatch(null)}
          onPlayerClick={onPlayerClick}
        />
      )}
    </div>
  );
}
