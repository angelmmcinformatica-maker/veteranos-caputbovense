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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch matchdays
      const matchdaysRef = collection(db, 'matchdays');
      const matchdaysSnap = await getDocs(matchdaysRef);
      const matchdaysData = matchdaysSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Matchday[];
      
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

  // Calculate standings from matchdays
  const standings = useMemo((): TeamStanding[] => {
    const teamStats: Record<string, TeamStanding> = {};

    // Process all played matches
    matchdays.forEach(matchday => {
      matchday.matches?.forEach(match => {
        if (match.status !== 'PLAYED') return;

        // Initialize teams if not exists
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

        const homeTeam = teamStats[match.home];
        const awayTeam = teamStats[match.away];

        // Update played count
        homeTeam.played++;
        awayTeam.played++;

        // Update goals
        homeTeam.goalsFor += match.homeGoals;
        homeTeam.goalsAgainst += match.awayGoals;
        awayTeam.goalsFor += match.awayGoals;
        awayTeam.goalsAgainst += match.homeGoals;

        // Determine winner and update points
        if (match.homeGoals > match.awayGoals) {
          homeTeam.won++;
          homeTeam.points += 3;
          homeTeam.form.push('W');
          awayTeam.lost++;
          awayTeam.form.push('L');
        } else if (match.homeGoals < match.awayGoals) {
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
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    standingsArray.forEach((team, index) => {
      team.position = index + 1;
    });

    return standingsArray;
  }, [matchdays]);

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

  // Get last played matchday
  const lastPlayedMatchday = useMemo(() => {
    const playedMatchdays = matchdays.filter(md => 
      md.matches?.some(m => m.status === 'PLAYED')
    );
    return playedMatchdays[playedMatchdays.length - 1] || null;
  }, [matchdays]);

  // Get next matchday
  const nextMatchday = useMemo(() => {
    return matchdays.find(md => 
      md.matches?.some(m => m.status === 'PENDING')
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
    refetch: fetchData
  };
}
