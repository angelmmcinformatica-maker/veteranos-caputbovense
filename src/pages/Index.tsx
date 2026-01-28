import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { HomeView } from '@/views/HomeView';
import { StandingsView } from '@/views/StandingsView';
import { MatchesView } from '@/views/MatchesView';
import { StatsView } from '@/views/StatsView';
import { AdminView } from '@/views/AdminView';
import { TeamDetailModal } from '@/components/teams/TeamDetailModal';
import { PlayerDetailModal } from '@/components/players/PlayerDetailModal';
import { useLeagueData } from '@/hooks/useLeagueData';

type Tab = 'home' | 'standings' | 'matches' | 'stats' | 'admin';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string; team: string } | null>(null);
  
  const { 
    matchdays,
    teams,
    matchReports,
    standings, 
    leader, 
    pichichi,
    topScorers,
    cardRankings,
    lastPlayedMatchday,
    nextMatchday,
    loading, 
    error,
    refetch
  } = useLeagueData();

  const handleTeamClick = (teamName: string) => {
    setSelectedTeam(teamName);
  };

  const handlePlayerClick = (playerName: string, teamName: string) => {
    setSelectedPlayer({ name: playerName, team: teamName });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-6 text-center max-w-sm">
          <p className="text-destructive mb-2">⚠️ Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView 
            leader={leader} 
            pichichi={pichichi}
            lastPlayedMatchday={lastPlayedMatchday}
            nextMatchday={nextMatchday}
            standings={standings}
            matchReports={matchReports}
            onTeamClick={handleTeamClick}
          />
        );
      case 'standings':
        return (
          <StandingsView 
            standings={standings} 
            onTeamClick={handleTeamClick}
          />
        );
      case 'matches':
        return (
          <MatchesView 
            matchdays={matchdays} 
            matchReports={matchReports}
            onTeamClick={handleTeamClick}
          />
        );
      case 'stats':
        return (
          <StatsView 
            topScorers={topScorers} 
            cardRankings={cardRankings}
            onPlayerClick={handlePlayerClick}
          />
        );
      case 'admin':
        return (
          <AdminView 
            matchdays={matchdays}
            teams={teams}
            matchReports={matchReports}
            onDataRefresh={refetch}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-4">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamDetailModal
          teamName={selectedTeam}
          matchdays={matchdays}
          teams={teams}
          matchReports={matchReports}
          onClose={() => setSelectedTeam(null)}
          onPlayerClick={handlePlayerClick}
        />
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          playerName={selectedPlayer.name}
          teamName={selectedPlayer.team}
          matchdays={matchdays}
          matchReports={matchReports}
          teams={teams}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default Index;
