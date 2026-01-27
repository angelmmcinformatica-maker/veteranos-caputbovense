import { useState } from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import { TopScorersTable } from '@/components/stats/TopScorersTable';
import { CardsTable } from '@/components/stats/CardsTable';
import type { TopScorer, CardRanking } from '@/types/league';
import { cn } from '@/lib/utils';

interface StatsViewProps {
  topScorers: TopScorer[];
  cardRankings: CardRanking[];
}

type StatsTab = 'scorers' | 'cards';

export function StatsView({ topScorers, cardRankings }: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<StatsTab>('scorers');

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Estadísticas</h2>
        <p className="text-sm text-muted-foreground">Rankings individuales</p>
      </div>

      {/* Tab selector */}
      <div className="glass-card p-1 mb-4 flex">
        <button
          onClick={() => setActiveTab('scorers')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'scorers'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Target className="w-4 h-4" />
          Goleadores
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            activeTab === 'cards'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Tarjetas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'scorers' ? (
        <TopScorersTable scorers={topScorers} />
      ) : (
        <CardsTable players={cardRankings} />
      )}
    </div>
  );
}
