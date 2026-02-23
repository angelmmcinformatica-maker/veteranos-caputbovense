import { useState, useMemo } from 'react';
import { LeaderCard } from '@/components/dashboard/LeaderCard';
import { PichichiCard } from '@/components/dashboard/PichichiCard';
import { MatchdaySection } from '@/components/dashboard/MatchdaySection';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { MatchDetailModal } from '@/components/matches/MatchDetailModal';
import { useTeamImages } from '@/hooks/useTeamImages';
import { InstallPWA } from '@/components/pwa/InstallPWA';
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

  // Sort matches by date then time, "Hora por confirmar" last within each day
  const sortByDateTime = (matches: Match[]) => 
    [...matches].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      // Within same day: matches without time go last
      const timeA = a.time || '';
      const timeB = b.time || '';
      if (!timeA && timeB) return 1;
      if (timeA && !timeB) return -1;
      return timeA.localeCompare(timeB);
    });

  const sortedFeaturedMatches = useMemo(() => 
    featuredMatchday?.matches ? sortByDateTime(featuredMatchday.matches) : [], 
    [featuredMatchday]);

  const sortedNextMatches = useMemo(() => 
    nextMatchday?.matches ? sortByDateTime(nextMatchday.matches) : [], 
    [nextMatchday]);

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
      {/* PWA Install Banner */}
      <InstallPWA />

      {/* Hero section */}
      <div className="grid gap-4 md:grid-cols-2">
        <LeaderCard leader={leader} shieldUrl={leaderShield} />
        <PichichiCard pichichi={pichichi} photoUrl={pichichiPhoto} />
      </div>

      {/* Matchday + Standings */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Featured Matchday (LIVE takes priority, otherwise Last Played) */}
        {featuredMatchday && (
          <MatchdaySection
            title={hasLiveMatch ? 'En Directo' : 'Última Jornada'}
            jornada={featuredMatchday.jornada}
            matches={sortedFeaturedMatches}
            rest={featuredMatchday.rest}
            variant={hasLiveMatch ? 'live' : 'played'}
            onMatchClick={setSelectedMatch}
            getMatchReport={getMatchReport}
          />
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
        <MatchdaySection
          title="Próxima Jornada"
          jornada={nextMatchday.jornada}
          matches={sortedNextMatches}
          rest={nextMatchday.rest}
          variant="upcoming"
          onMatchClick={setSelectedMatch}
        />
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
