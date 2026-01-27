import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { HomeView } from '@/views/HomeView';
import { StandingsView } from '@/views/StandingsView';
import { MatchesView } from '@/views/MatchesView';
import { StatsView } from '@/views/StatsView';
import { AdminView } from '@/views/AdminView';
import { useLeagueData } from '@/hooks/useLeagueData';

type Tab = 'home' | 'standings' | 'matches' | 'stats' | 'admin';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { 
    matchdays,
    standings, 
    leader, 
    pichichi,
    topScorers,
    cardRankings,
    lastPlayedMatchday,
    nextMatchday,
    loading, 
    error 
  } = useLeagueData();

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
          />
        );
      case 'standings':
        return <StandingsView standings={standings} />;
      case 'matches':
        return <MatchesView matchdays={matchdays} />;
      case 'stats':
        return <StatsView topScorers={topScorers} cardRankings={cardRankings} />;
      case 'admin':
        return <AdminView />;
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
    </div>
  );
};

export default Index;
