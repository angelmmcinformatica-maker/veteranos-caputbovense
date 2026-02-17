import { useState, useMemo } from 'react';
import { X, Users, Calendar, Trophy, Target, Shield, User, Home, Car, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matchday, Match, Team, MatchReport, MatchReportPlayer } from '@/types/league';
import { MatchDetailModal } from '@/components/matches/MatchDetailModal';
import { useTeamImages } from '@/hooks/useTeamImages';

interface TeamDetailModalProps {
  teamName: string;
  matchdays: Matchday[];
  teams: Team[];
  matchReports: MatchReport[];
  onClose: () => void;
  onPlayerClick?: (playerName: string, teamName: string) => void;
}

type Tab = 'matches' | 'roster';
type SortOption = 'dorsal' | 'games' | 'goals' | 'cards';

export function TeamDetailModal({ 
  teamName, 
  matchdays, 
  teams,
  matchReports, 
  onClose,
  onPlayerClick 
}: TeamDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('dorsal');
  const { getTeamShield, getPlayerPhoto } = useTeamImages();

  const teamShield = getTeamShield(teamName);

  // Get all matches for this team
  const teamMatches = matchdays.flatMap(md => 
    md.matches?.filter(m => m.home === teamName || m.away === teamName)
      .map(m => ({ ...m, jornada: md.jornada })) || []
  ).sort((a, b) => a.jornada - b.jornada);

  // Get team roster from teams collection - SORTED BY DORSAL
  const team = teams.find(t => t.name === teamName);
  const roster = [...(team?.players || [])].sort((a, b) => {
    const dorsalA = typeof a.id === 'number' ? a.id : parseInt(String(a.id)) || 999;
    const dorsalB = typeof b.id === 'number' ? b.id : parseInt(String(b.id)) || 999;
    if (dorsalA !== dorsalB) return dorsalA - dorsalB;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Calculate team stats
  const playedMatches = teamMatches.filter(m => m.status === 'PLAYED');
  const wins = playedMatches.filter(m => 
    (m.home === teamName && m.homeGoals > m.awayGoals) ||
    (m.away === teamName && m.awayGoals > m.homeGoals)
  ).length;
  const draws = playedMatches.filter(m => m.homeGoals === m.awayGoals).length;
  const losses = playedMatches.length - wins - draws;
  
  const goalsFor = playedMatches.reduce((acc, m) => 
    acc + (m.home === teamName ? m.homeGoals : m.awayGoals), 0);
  const goalsAgainst = playedMatches.reduce((acc, m) => 
    acc + (m.home === teamName ? m.awayGoals : m.homeGoals), 0);

  const getMatchReport = (match: Match): MatchReport | null => {
    const reportId = `${match.home}-${match.away}`;
    return matchReports.find(r => r.id === reportId) || null;
  };

  // Get player stats from match reports
  const getPlayerStats = (playerName: string) => {
    let goals = 0, yellowCards = 0, redCards = 0, gamesPlayed = 0, gamesStarted = 0;

    matchReports.forEach(report => {
      const teamData = report[teamName];
      if (typeof teamData === 'object' && teamData && 'players' in teamData) {
        const players = (teamData as { players: MatchReportPlayer[] }).players || [];
        const player = players.find(p => p.name === playerName);
        if (player) {
          gamesPlayed++;
          if (player.isStarting) gamesStarted++;
          goals += player.goals || 0;
          yellowCards += player.yellowCards || 0;
          redCards += (player.redCards || 0) + (player.directRedCards || 0);
        }
      }
    });

    return { goals, yellowCards, redCards, gamesPlayed, gamesStarted };
  };

  // Sorted roster based on selected sort option
  const sortedRoster = useMemo(() => {
    if (sortBy === 'dorsal') return roster;
    return [...roster].sort((a, b) => {
      const statsA = getPlayerStats(a.name);
      const statsB = getPlayerStats(b.name);
      if (sortBy === 'games') return statsB.gamesPlayed - statsA.gamesPlayed;
      if (sortBy === 'goals') return statsB.goals - statsA.goals;
      if (sortBy === 'cards') return (statsB.yellowCards + statsB.redCards) - (statsA.yellowCards + statsA.redCards);
      return 0;
    });
  }, [roster, sortBy]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 glass-card border-b border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {teamShield ? (
                  <img src={teamShield} alt={teamName} className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold">{teamName}</h2>
                  <p className="text-xs text-muted-foreground">{roster.length} jugadores</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="text-center p-2 rounded-lg bg-secondary/30">
                <p className="text-lg font-bold">{playedMatches.length}</p>
                <p className="text-[10px] text-muted-foreground">PJ</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-primary/10">
                <p className="text-lg font-bold text-primary">{wins}</p>
                <p className="text-[10px] text-muted-foreground">Ganados</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-warning/10">
                <p className="text-lg font-bold text-warning">{draws}</p>
                <p className="text-[10px] text-muted-foreground">Empates</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-destructive/10">
                <p className="text-lg font-bold text-destructive">{losses}</p>
                <p className="text-[10px] text-muted-foreground">Perdidos</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/30">
                <p className="text-lg font-bold">{goalsFor}-{goalsAgainst}</p>
                <p className="text-[10px] text-muted-foreground">Goles</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('matches')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                  activeTab === 'matches' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <Calendar className="w-4 h-4" />
                Partidos
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
                  activeTab === 'roster' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="w-4 h-4" />
                Plantilla
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'matches' && (
              <div className="space-y-2">
                {teamMatches.map((match, index) => {
                  const isHome = match.home === teamName;
                  const opponent = isHome ? match.away : match.home;
                  const opponentShield = getTeamShield(opponent);
                  const goalsOwn = isHome ? match.homeGoals : match.awayGoals;
                  const goalsOpp = isHome ? match.awayGoals : match.homeGoals;
                  const isWin = match.status === 'PLAYED' && goalsOwn > goalsOpp;
                  const isDraw = match.status === 'PLAYED' && goalsOwn === goalsOpp;
                  const isLoss = match.status === 'PLAYED' && goalsOwn < goalsOpp;
                  const hasReport = !!getMatchReport(match);

                  return (
                    <button
                      key={index}
                      onClick={() => match.status === 'PLAYED' ? setSelectedMatch(match) : undefined}
                      className={cn(
                        'w-full glass-card p-2 sm:p-3 text-left transition-all',
                        match.status === 'PLAYED' && 'cursor-pointer hover:ring-1 hover:ring-primary/50',
                        match.status !== 'PLAYED' && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {/* Left: Jornada + Home/Away + Shield */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <div className={cn(
                            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold',
                            isWin && 'bg-primary/20 text-primary',
                            isDraw && 'bg-warning/20 text-warning',
                            isLoss && 'bg-destructive/20 text-destructive',
                            match.status !== 'PLAYED' && 'bg-secondary text-muted-foreground'
                          )}>
                            J{match.jornada}
                          </div>
                          <div className={cn(
                            'w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center',
                            isHome ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                          )}>
                            {isHome ? <Home className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                          </div>
                          {opponentShield ? (
                            <img src={opponentShield} alt={opponent} className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Center: Opponent name - flexible with truncation */}
                        <div className="flex-1 min-w-0 px-1">
                          <p className="text-xs sm:text-sm font-medium truncate">{opponent}</p>
                          <p className="text-[10px] text-muted-foreground">{match.date}</p>
                        </div>

                        {/* Right: Result - fixed width, priority */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {match.status === 'PLAYED' ? (
                            <span className={cn(
                              'text-sm sm:text-base font-bold whitespace-nowrap tabular-nums',
                              isWin && 'text-primary',
                              isLoss && 'text-destructive'
                            )}>
                              {goalsOwn}-{goalsOpp}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {match.time || 'Pend.'}
                            </span>
                          )}
                          {hasReport && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {teamMatches.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay partidos registrados</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roster' && (
              <div className="space-y-3">
                {/* Sort options */}
                <div className="flex items-center gap-2 flex-wrap">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  {([
                    ['dorsal', 'Dorsal'],
                    ['games', 'Partidos'],
                    ['goals', 'Goles'],
                    ['cards', 'Tarjetas'],
                  ] as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full transition-colors',
                        sortBy === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {sortedRoster.map((player) => {
                    const stats = getPlayerStats(player.name);
                    const photoUrl = getPlayerPhoto(teamName, player.id);
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => onPlayerClick?.(player.name, teamName)}
                        className="w-full glass-card p-3 text-left transition-all hover:ring-1 hover:ring-primary/50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={player.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary">
                                {typeof player.id === 'number' ? player.id : '#'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {player.alias || player.name}
                              </p>
                              {player.alias && (
                                <p className="text-xs text-muted-foreground">{player.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-center">
                              <p className="font-bold">{stats.gamesPlayed}</p>
                              <p className="text-muted-foreground">PJ</p>
                            </div>
                            {stats.goals > 0 && (
                              <div className="text-center">
                                <p className="font-bold text-primary">{stats.goals}</p>
                                <p className="text-muted-foreground">Goles</p>
                              </div>
                            )}
                            {stats.yellowCards > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-4 bg-warning rounded-sm" />
                                <span className="font-medium">{stats.yellowCards}</span>
                              </div>
                            )}
                            {stats.redCards > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-4 bg-destructive rounded-sm" />
                                <span className="font-medium">{stats.redCards}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {roster.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay jugadores registrados</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </>
  );
}
