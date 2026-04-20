import { Trophy, Home, ArrowRight, Shield } from 'lucide-react';
import { useTeamImages } from '@/hooks/useTeamImages';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeaturedMatch {
  id: string;
  round: string;
  home: string;
  away: string;
  homePoints: number;
  awayPoints: number;
  competition: 'liga' | 'copa';
}

const featuredMatches: FeaturedMatch[] = [
  // Cuartos de Liga (los 4)
  { id: 'l-qf1', round: 'Cuartos Liga', home: 'Inter Don Benito Polo Opuesto', away: 'Valdehornillos Veteranos', homePoints: 67, awayPoints: 51, competition: 'liga' },
  { id: 'l-qf2', round: 'Cuartos Liga', home: 'Santa Amalia Veteranos', away: 'Palazuelo Santa Teresa', homePoints: 72, awayPoints: 44, competition: 'liga' },
  { id: 'l-qf3', round: 'Cuartos Liga', home: 'Transtello Miajadas', away: 'Talarrubias Veteranos', homePoints: 51, awayPoints: 44, competition: 'liga' },
  { id: 'l-qf4', round: 'Cuartos Liga', home: 'Meson Los Barros Don Benito', away: 'Valdivia Veteranos', homePoints: 79, awayPoints: 59, competition: 'liga' },
  // 2 destacados de Copa
  { id: 'c-o5', round: 'Octavos Copa', home: 'Vulebar Texeira Don Benito', away: 'Campanario Interserena', homePoints: 86, awayPoints: 55, competition: 'copa' },
  { id: 'c-o8', round: 'Octavos Copa', home: 'AD Caputbovense', away: 'Hernan Cortes Veteranos', homePoints: 70, awayPoints: 49, competition: 'copa' },
];

interface PlayoffsHeroProps {
  onNavigate: () => void;
  onTeamClick?: (teamName: string) => void;
}

export function PlayoffsHero({ onNavigate, onTeamClick }: PlayoffsHeroProps) {
  const { getTeamShield } = useTeamImages();

  const TeamRow = ({ name, points, isHome }: { name: string; points: number; isHome: boolean }) => {
    const shield = getTeamShield(name);
    return (
      <div className={cn(
        'flex items-center gap-2 min-w-0',
        isHome && 'font-semibold'
      )}>
        {shield ? (
          <img src={shield} alt={name} className="w-7 h-7 object-contain flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTeamClick?.(name);
            }}
            className="text-left text-sm leading-tight hover:text-primary transition-colors truncate w-full"
          >
            {name}
          </button>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {isHome && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold">
                <Home className="w-2.5 h-2.5" />
                LOCAL
              </span>
            )}
            <span>{points} pts dep.</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 p-4 sm:p-6 shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.4)]">
      {/* Glow accent */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
              🏆 FASE FINAL: PLAY-OFFS
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Eliminatorias a partido único · Local: mejor en Deportividad
            </p>
          </div>
        </div>
      </div>

      {/* Featured cards grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {featuredMatches.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={onNavigate}
            className={cn(
              'group text-left rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-lg',
              m.competition === 'liga'
                ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
                : 'border-slate-400/30 bg-slate-400/5 hover:border-slate-400/60'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                m.competition === 'liga'
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-slate-400/20 text-slate-300'
              )}>
                {m.round}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="space-y-2">
              <TeamRow name={m.home} points={m.homePoints} isHome={true} />
              <div className="flex items-center gap-2 pl-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium">VS</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <TeamRow name={m.away} points={m.awayPoints} isHome={false} />
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="relative flex justify-center">
        <Button
          size="lg"
          onClick={onNavigate}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/30 px-6 sm:px-8"
        >
          <Trophy className="w-4 h-4" />
          VER CUADRO COMPLETO Y CRUCES
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
