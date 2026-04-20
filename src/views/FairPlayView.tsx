import { HeartHandshake, Home, Shield, Info } from 'lucide-react';
import { deportividadData } from '@/data/deportividadData';
import { useTeamImages } from '@/hooks/useTeamImages';

interface FairPlayViewProps {
  onTeamClick?: (teamName: string) => void;
}

export function FairPlayView({ onTeamClick }: FairPlayViewProps) {
  const { getTeamShield } = useTeamImages();

  const sorted = [...deportividadData].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.sanctionPoints !== b.sanctionPoints) return a.sanctionPoints - b.sanctionPoints;
    return a.team.localeCompare(b.team);
  });

  return (
    <div className="animate-fade-up space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <HeartHandshake className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Juego Limpio · 2025/26
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text">
          Clasificación de Deportividad
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Premio al juego limpio y la conducta deportiva del Campeonato Caputbovense.
        </p>
      </div>

      {/* Regla de oro */}
      <div className="glass-card border border-primary/20 p-3 sm:p-4 flex items-start gap-3 max-w-3xl mx-auto">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-primary" />
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary" />
            Regla de oro
          </p>
          <p className="text-muted-foreground mt-0.5">
            El equipo con mayor puntuación de deportividad <span className="text-primary font-bold">gana el factor cancha</span> en las eliminatorias de <span className="text-primary font-bold">Play-off a partido único</span>.
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_44px_44px_56px_64px] sm:grid-cols-[48px_1fr_72px_72px_88px_96px] gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-primary/10 border-b border-primary/20 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-primary">
          <div className="text-center">Pos</div>
          <div>Equipo</div>
          <div className="text-center" title="Tarjetas amarillas">🟨</div>
          <div className="text-center" title="Tarjetas rojas">🟥</div>
          <div className="text-center">Sanción</div>
          <div className="text-center">Puntos</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {sorted.map((entry, idx) => {
            const pos = idx + 1;
            const shield = getTeamShield(entry.team);
            const isTop = pos <= 3;
            return (
              <button
                key={entry.team}
                type="button"
                onClick={() => onTeamClick?.(entry.team)}
                className="w-full grid grid-cols-[40px_1fr_44px_44px_56px_64px] sm:grid-cols-[48px_1fr_72px_72px_88px_96px] gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-white/5 transition-colors text-left items-center"
              >
                <div
                  className={`text-center text-[11px] sm:text-sm font-extrabold tabular-nums ${
                    isTop ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {pos}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 rounded-full bg-secondary/60 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                    {shield ? (
                      <img src={shield} alt={entry.team} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-3 h-3 text-muted-foreground/40" />
                    )}
                  </div>
                  <span className="text-[11px] sm:text-sm font-semibold truncate">
                    {entry.team}
                  </span>
                </div>
                <div className="text-center text-[11px] sm:text-sm font-bold tabular-nums text-yellow-500">
                  {entry.yellowCards}
                </div>
                <div className="text-center text-[11px] sm:text-sm font-bold tabular-nums text-red-500">
                  {entry.redCards}
                </div>
                <div className="text-center text-[11px] sm:text-sm font-bold tabular-nums text-muted-foreground">
                  {entry.sanctionPoints > 0 ? `-${entry.sanctionPoints}` : '0'}
                </div>
                <div
                  className={`text-center text-sm sm:text-base font-extrabold tabular-nums ${
                    isTop ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {entry.totalPoints}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-center text-muted-foreground/60 italic">
        Datos de deportividad oficiales del Comité de Competición.
      </p>
    </div>
  );
}
