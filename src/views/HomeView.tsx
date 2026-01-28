import { useState, useMemo } from 'react';
import { LeaderCard } from '@/components/dashboard/LeaderCard';
import { PichichiCard } from '@/components/dashboard/PichichiCard';
import { MatchCard } from '@/components/matches/MatchCard';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { MatchDetailModal } from '@/components/matches/MatchDetailModal';
import { Calendar, CheckCircle2, Radio } from 'lucide-react';
import { useTeamImages } from '@/hooks/useTeamImages';
import type { TeamStanding, TopScorer, Matchday, Match, MatchReport, Team } from '@/types/league';

interface HomeViewProps {
  leader: TeamStanding | null;
  pichichi: TopScorer | null;
  lastPlayedMatchday: Matchday | null;
  nextMatchday: Matchday | null;
  standings: TeamStanding[];
  matchReports: MatchReport[];
  teams: Team[];
  onTeamClick?: (teamName: string) => void;
  onPlayerClick?: (playerName: string, teamName: string) => void;
}

export function HomeView({ leader, pichichi, lastPlayedMatchday, nextMatchday, standings, matchReports, teams, onTeamClick, onPlayerClick }: HomeViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const { getTeamShield, getPlayerPhoto } = useTeamImages();

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
  };

  // Determine which matchday to show - prioritize LIVE matches
  const liveMatchday = useMemo(() => {
    // Check if lastPlayedMatchday has any live match
    if (lastPlayedMatchday?.matches?.some(m => m.status === 'LIVE')) {
      return lastPlayedMatchday;
    }
    // Check if nextMatchday has any live match
    if (nextMatchday?.matches?.some(m => m.status === 'LIVE')) {
      return nextMatchday;
    }
    return null;
  }, [lastPlayedMatchday, nextMatchday]);

  const hasLiveMatch = !!liveMatchday;

  // Get featured matchday: if there's a live one, show that instead of last played
  const featuredMatchday = liveMatchday || lastPlayedMatchday;

  // Get pichichi player ID from teams data
  const pichichiPlayerId = useMemo(() => {
    if (!pichichi) return undefined;
    const team = teams.find(t => t.name === pichichi.team);
    if (!team?.players) return undefined;
    
    // Try to find by player name or alias
    const player = team.players.find(p => 
      p.name === pichichi.name || 
      p.alias === pichichi.name ||
      p.name?.toLowerCase() === pichichi.name?.toLowerCase() ||
      p.alias?.toLowerCase() === pichichi.name?.toLowerCase()
    );
    return player?.id;
  }, [pichichi, teams]);

  // Get leader shield and pichichi photo
  const leaderShield = leader ? getTeamShield(leader.team) : undefined;
  const pichichiPhoto = pichichi && pichichiPlayerId 
    ? getPlayerPhoto(pichichi.team, pichichiPlayerId) 
    : undefined;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Hero section */}
      <div className="grid gap-4 md:grid-cols-2">
        <LeaderCard leader={leader} shieldUrl={leaderShield} />
        <PichichiCard pichichi={pichichi} photoUrl={pichichiPhoto} />
      </div>

      {/* Matchday + Standings */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Featured Matchday (LIVE takes priority, otherwise Last Played) */}
        {featuredMatchday && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {hasLiveMatch ? (
                  <>
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <h3 className="text-sm font-semibold text-red-500">En Directo</h3>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Última Jornada</h3>
                  </>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${hasLiveMatch ? 'bg-red-500/20 text-red-400' : 'bg-secondary text-muted-foreground'}`}>
                Jornada {featuredMatchday.jornada}
              </span>
            </div>
            <div className="space-y-2">
              {featuredMatchday.matches?.map((match, index) => (
                <MatchCard 
                  key={index} 
                  match={match} 
                  compact 
                  onClick={() => setSelectedMatch(match)}
                  hasReport={!!getMatchReport(match)}
                />
              ))}
            </div>
            {featuredMatchday.rest && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Descansa: <span className="font-medium text-foreground">{featuredMatchday.rest}</span>
              </p>
            )}
          </div>
        )}

        {/* Full Standings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">Clasificación</h3>
          </div>
          <StandingsTable standings={standings} onTeamClick={onTeamClick} />
        </div>
      </div>

      {/* Next Matchday - only show if not already showing a LIVE matchday */}
      {nextMatchday && !hasLiveMatch && (
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
              <MatchCard key={index} match={match} compact showTime onClick={() => setSelectedMatch(match)} />
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
          teams={teams}
          onClose={() => setSelectedMatch(null)}
          onPlayerClick={onPlayerClick}
        />
      )}
    </div>
  );
}
