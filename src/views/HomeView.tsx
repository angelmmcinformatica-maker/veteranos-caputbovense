import { LeaderCard } from '@/components/dashboard/LeaderCard';
import { PichichiCard } from '@/components/dashboard/PichichiCard';
import { MatchdayPreview } from '@/components/dashboard/MatchdayPreview';
import type { TeamStanding, TopScorer, Matchday } from '@/types/league';

interface HomeViewProps {
  leader: TeamStanding | null;
  pichichi: TopScorer | null;
  lastPlayedMatchday: Matchday | null;
  nextMatchday: Matchday | null;
}

export function HomeView({ leader, pichichi, lastPlayedMatchday, nextMatchday }: HomeViewProps) {
  return (
    <div className="space-y-4 animate-fade-up">
      {/* Hero section */}
      <div className="grid gap-4 md:grid-cols-2">
        <LeaderCard leader={leader} />
        <PichichiCard pichichi={pichichi} />
      </div>

      {/* Matchdays */}
      <div className="grid gap-4 md:grid-cols-2">
        <MatchdayPreview 
          title="Última Jornada" 
          matchday={lastPlayedMatchday} 
        />
        <MatchdayPreview 
          title="Próxima Jornada" 
          matchday={nextMatchday}
          showTime
        />
      </div>
    </div>
  );
}
