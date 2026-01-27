import { useState } from 'react';
import { LeaderCard } from '@/components/dashboard/LeaderCard';
import { PichichiCard } from '@/components/dashboard/PichichiCard';
import { MatchCard } from '@/components/matches/MatchCard';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { MatchDetailModal } from '@/components/matches/MatchDetailModal';
import { Calendar, CheckCircle2 } from 'lucide-react';
import type { TeamStanding, TopScorer, Matchday, Match, MatchReport } from '@/types/league';

interface HomeViewProps {
  leader: TeamStanding | null;
  pichichi: TopScorer | null;
  lastPlayedMatchday: Matchday | null;
  nextMatchday: Matchday | null;
  standings: TeamStanding[];
  matchReports: MatchReport[];
}

export function HomeView({ leader, pichichi, lastPlayedMatchday, nextMatchday, standings, matchReports }: HomeViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Hero section */}
      <div className="grid gap-4 md:grid-cols-2">
        <LeaderCard leader={leader} />
        <PichichiCard pichichi={pichichi} />
      </div>

      {/* Matchday + Standings */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Last Matchday Full */}
        {lastPlayedMatchday && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Última Jornada</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                Jornada {lastPlayedMatchday.jornada}
              </span>
            </div>
            <div className="space-y-2">
              {lastPlayedMatchday.matches?.map((match, index) => (
                <MatchCard 
                  key={index} 
                  match={match} 
                  compact 
                  onClick={() => setSelectedMatch(match)}
                  hasReport={!!getMatchReport(match)}
                />
              ))}
            </div>
            {lastPlayedMatchday.rest && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Descansa: <span className="font-medium text-foreground">{lastPlayedMatchday.rest}</span>
              </p>
            )}
          </div>
        )}

        {/* Full Standings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">Clasificación</h3>
          </div>
          <StandingsTable standings={standings} />
        </div>
      </div>

      {/* Next Matchday */}
      {nextMatchday && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Próxima Jornada</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              Jornada {nextMatchday.jornada}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {nextMatchday.matches?.map((match, index) => (
              <MatchCard key={index} match={match} compact showTime />
            ))}
          </div>
          {nextMatchday.rest && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Descansa: <span className="font-medium text-foreground">{nextMatchday.rest}</span>
            </p>
          )}
        </div>
      )}

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          matchReport={getMatchReport(selectedMatch)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
