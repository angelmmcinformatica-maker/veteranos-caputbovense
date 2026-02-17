import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  Matchday, 
  Team, 
  MatchReport, 
  TeamStanding, 
  TopScorer, 
  CardRanking,
  Match
} from '@/types/league';

export function useLeagueData() {
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefetch = false) => {
    try {
      // Only show loading screen on initial load, not on refetch
      if (!isRefetch) {
        setLoading(true);
      }
      
      // Fetch matchdays
      const matchdaysRef = collection(db, 'matchdays');
      const matchdaysSnap = await getDocs(matchdaysRef);
      const matchdaysData = matchdaysSnap.docs.map(doc => {
        const data = doc.data();
        const matchdayDate = data.date || '';
        
        // Inherit matchday date to all matches and normalize SCHEDULED to PENDING
        const matches = (data.matches || []).map((match: any) => ({
          ...match,
          // Use matchday's date if match doesn't have its own date
          date: match.date || matchdayDate,
          // Normalize SCHEDULED status to PENDING
          status: match.status === 'SCHEDULED' ? 'PENDING' : match.status
        }));
        
        return {
          id: doc.id,
          ...data,
          matches
        };
      }) as Matchday[];
      
      // Sort matchdays by jornada number
      matchdaysData.sort((a, b) => a.jornada - b.jornada);
      setMatchdays(matchdaysData);

      // Fetch teams
      const teamsRef = collection(db, 'teams');
      const teamsSnap = await getDocs(teamsRef);
      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
      setTeams(teamsData);

      // Fetch match reports
      const reportsRef = collection(db, 'match_reports');
      const reportsSnap = await getDocs(reportsRef);
      const reportsData = reportsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MatchReport[];
      setMatchReports(reportsData);

      setError(null);
    } catch (err) {
      console.error('Error fetching league data:', err);
      setError('Error al cargar los datos de la liga');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate standings from matchdays - include ALL teams
  const standings = useMemo((): TeamStanding[] => {
    const teamStats: Record<string, TeamStanding> = {};

    // First, initialize ALL teams from teams collection (ensures all 27 teams appear)
    teams.forEach(team => {
      if (!teamStats[team.name]) {
        teamStats[team.name] = {
          position: 0,
          team: team.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: []
        };
      }
    });

    // Also initialize teams from matchdays (in case some aren't in teams collection)
    matchdays.forEach(matchday => {
      matchday.matches?.forEach(match => {
        [match.home, match.away].forEach(team => {
          if (!teamStats[team]) {
            teamStats[team] = {
              position: 0,
              team,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              form: []
            };
          }
        });
      });
    });

    // Process all played AND LIVE matches (live matches count for real-time standings)
    matchdays.forEach(matchday => {
      matchday.matches?.forEach(match => {
        // Include both PLAYED and LIVE matches in standings
        if (match.status !== 'PLAYED' && match.status !== 'LIVE') return;

        const homeTeam = teamStats[match.home];
        const awayTeam = teamStats[match.away];

        if (!homeTeam || !awayTeam) return;

        // Update played count
        homeTeam.played++;
        awayTeam.played++;

        // Update goals
        homeTeam.goalsFor += match.homeGoals || 0;
        homeTeam.goalsAgainst += match.awayGoals || 0;
        awayTeam.goalsFor += match.awayGoals || 0;
        awayTeam.goalsAgainst += match.homeGoals || 0;

        // Determine winner and update points
        if ((match.homeGoals || 0) > (match.awayGoals || 0)) {
          homeTeam.won++;
          homeTeam.points += 3;
          homeTeam.form.push('W');
          awayTeam.lost++;
          awayTeam.form.push('L');
        } else if ((match.homeGoals || 0) < (match.awayGoals || 0)) {
          awayTeam.won++;
          awayTeam.points += 3;
          awayTeam.form.push('W');
          homeTeam.lost++;
          homeTeam.form.push('L');
        } else {
          homeTeam.drawn++;
          homeTeam.points += 1;
          homeTeam.form.push('D');
          awayTeam.drawn++;
          awayTeam.points += 1;
          awayTeam.form.push('D');
        }
      });
    });

    // Calculate goal difference and sort
    const standingsArray = Object.values(teamStats).map(team => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
      form: team.form.slice(-5) // Last 5 results
    }));

    standingsArray.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      // Alphabetical as final tiebreaker
      return a.team.localeCompare(b.team);
    });

    // Assign positions
    standingsArray.forEach((team, index) => {
      team.position = index + 1;
    });

    return standingsArray;
  }, [matchdays, teams]);

  // Get the leader team
  const leader = useMemo(() => standings[0] || null, [standings]);

  // Calculate top scorers from match reports
  const topScorers = useMemo((): TopScorer[] => {
    const scorers: Record<string, TopScorer> = {};

    matchReports.forEach(report => {
      Object.entries(report).forEach(([key, value]) => {
        if (key === 'id' || key === 'observations' || typeof value === 'string') return;
        
        const teamData = value as { players: any[] };
        const teamName = key;

        teamData.players?.forEach(player => {
          if (player.goals > 0) {
            const playerId = `${player.name}-${teamName}`;
            if (!scorers[playerId]) {
              scorers[playerId] = {
                name: player.name,
                team: teamName,
                goals: 0,
                playerId: player.id
              };
            }
            scorers[playerId].goals += player.goals;
          }
        });
      });
    });

    return Object.values(scorers)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
  }, [matchReports]);

  // Get pichichi (top scorer)
  const pichichi = useMemo(() => topScorers[0] || null, [topScorers]);

  // Calculate card rankings
  const cardRankings = useMemo((): CardRanking[] => {
    const players: Record<string, CardRanking> = {};

    matchReports.forEach(report => {
      Object.entries(report).forEach(([key, value]) => {
        if (key === 'id' || key === 'observations' || typeof value === 'string') return;
        
        const teamData = value as { players: any[] };
        const teamName = key;

        teamData.players?.forEach(player => {
          if (player.yellowCards > 0 || player.redCards > 0 || player.directRedCards > 0) {
            const playerId = `${player.name}-${teamName}`;
            if (!players[playerId]) {
              players[playerId] = {
                name: player.name,
                team: teamName,
                yellowCards: 0,
                redCards: 0,
                playerId: player.id
              };
            }
            players[playerId].yellowCards += player.yellowCards || 0;
            players[playerId].redCards += (player.redCards || 0) + (player.directRedCards || 0);
          }
        });
      });
    });

    return Object.values(players)
      .sort((a, b) => {
        const totalA = a.yellowCards + (a.redCards * 3);
        const totalB = b.yellowCards + (b.redCards * 3);
        return totalB - totalA;
      })
      .slice(0, 20);
  }, [matchReports]);

  // Helper: check if a matchday date is today or in the past
  const isMatchdayTodayOrPast = (md: Matchday): boolean => {
    if (!md.date) return false;
    // Expect date format like "DD/MM/YYYY" or "YYYY-MM-DD"
    let mdDate: Date | null = null;
    if (md.date.includes('/')) {
      const parts = md.date.split('/');
      if (parts.length === 3) {
        mdDate = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      }
    } else {
      mdDate = new Date(md.date);
    }
    if (!mdDate || isNaN(mdDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mdDate.setHours(0, 0, 0, 0);
    return mdDate <= today;
  };

  // Get last played matchday - includes matchdays whose date is today (match day logic)
  const lastPlayedMatchday = useMemo(() => {
    const relevantMatchdays = matchdays.filter(md => 
      md.matches?.some(m => m.status === 'PLAYED' || m.status === 'LIVE') || isMatchdayTodayOrPast(md)
    );
    return relevantMatchdays[relevantMatchdays.length - 1] || null;
  }, [matchdays]);

  // Get next matchday (PENDING or SCHEDULED, and date is in the future)
  const nextMatchday = useMemo(() => {
    return matchdays.find(md => 
      md.matches?.some(m => m.status === 'PENDING' || m.status === 'SCHEDULED') && !isMatchdayTodayOrPast(md)
    ) || null;
  }, [matchdays]);

  return {
    matchdays,
    teams,
    matchReports,
    standings,
    leader,
    topScorers,
    pichichi,
    cardRankings,
    lastPlayedMatchday,
    nextMatchday,
    loading,
    error,
    refetch: () => fetchData(true)
  };
}
