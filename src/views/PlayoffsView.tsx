import { Trophy, Award, ChevronRight } from 'lucide-react';
import { useTeamImages } from '@/hooks/useTeamImages';

interface PlayoffsViewProps {
  onTeamClick?: (teamName: string) => void;
}

interface BracketTeam {
  label: string; // e.g. "1º Grupo A"
  team?: string | null; // resolved team name when known
}

interface BracketMatch {
  id: string;
  round: string;
  home: BracketTeam;
  away: BracketTeam;
  legs?: number; // 1 or 2
  legResults?: Array<{ home: number | null; away: number | null }>;
}

// ============== HARDCODED BRACKETS ==============
const leagueBracket: BracketMatch[] = [
  {
    id: 'sf1',
    round: 'Semifinal 1',
    home: { label: '1º Grupo A' },
    away: { label: '2º Grupo B' },
    legs: 2,
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
  {
    id: 'sf2',
    round: 'Semifinal 2',
    home: { label: '1º Grupo B' },
    away: { label: '2º Grupo A' },
    legs: 2,
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
];

const leagueFinal: BracketMatch = {
  id: 'final',
  round: 'Gran Final de Liga',
  home: { label: 'Ganador SF1' },
  away: { label: 'Ganador SF2' },
  legs: 2,
  legResults: [{ home: null, away: null }, { home: null, away: null }],
};

// Cup - Round of 16
const cupR16: BracketMatch[] = [
  { id: 'r16-1', round: 'Octavos 1', home: { label: '3º Grupo A' }, away: { label: '6º Grupo A' } },
  { id: 'r16-2', round: 'Octavos 2', home: { label: '3º Grupo B' }, away: { label: '6º Grupo B' } },
  { id: 'r16-3', round: 'Octavos 3', home: { label: '4º Grupo A' }, away: { label: '5º Grupo B' } },
  { id: 'r16-4', round: 'Octavos 4', home: { label: '4º Grupo B' }, away: { label: '5º Grupo A' } },
  { id: 'r16-5', round: 'Octavos 5', home: { label: '1º Grupo C' }, away: { label: '4º Grupo C' } },
  { id: 'r16-6', round: 'Octavos 6', home: { label: '2º Grupo C' }, away: { label: '3º Grupo C' } },
  { id: 'r16-7', round: 'Octavos 7', home: { label: '7º Grupo A' }, away: { label: '8º Grupo B' } },
  { id: 'r16-8', round: 'Octavos 8', home: { label: '7º Grupo B' }, away: { label: '8º Grupo A' } },
];

// ============== Components ==============

function TeamSlot({
  team,
  label,
  score,
  onTeamClick,
  getTeamShield,
}: {
  team?: string | null;
  label: string;
  score?: number | null;
  onTeamClick?: (t: string) => void;
  getTeamShield: (t: string) => string | undefined;
}) {
  const shield = team ? getTeamShield(team) : undefined;
  const display = team || label;
  const isPlaceholder = !team;

  return (
    <button
      type="button"
      onClick={() => team && onTeamClick?.(team)}
      disabled={!team}
      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 transition-colors text-left disabled:cursor-default"
    >
      <div className="w-6 h-6 flex-shrink-0 rounded-full bg-secondary/60 flex items-center justify-center overflow-hidden">
        {shield ? (
          <img src={shield} alt={team || ''} className="w-full h-full object-cover" />
        ) : (
          <Trophy className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>
      <span
        className={`flex-1 text-xs sm:text-sm truncate ${
          isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground font-medium'
        }`}
      >
        {display}
      </span>
      <span className="text-sm font-bold tabular-nums text-muted-foreground/70 min-w-[20px] text-right">
        {score ?? '-'}
      </span>
    </button>
  );
}

function BracketCard({
  match,
  onTeamClick,
  getTeamShield,
  accent = 'primary',
}: {
  match: BracketMatch;
  onTeamClick?: (t: string) => void;
  getTeamShield: (t: string) => string | undefined;
  accent?: 'primary' | 'muted';
}) {
  const accentBorder = accent === 'primary' ? 'border-primary/20 hover:border-primary/40' : 'border-white/10 hover:border-white/20';
  const accentText = accent === 'primary' ? 'text-primary' : 'text-muted-foreground';
  const legs = match.legs || 1;

  return (
    <div className={`glass-card border ${accentBorder} overflow-hidden transition-all w-full`}>
      <div className={`px-3 py-1.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between`}>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentText}`}>
          {match.round}
        </span>
        {legs === 2 && (
          <span className="text-[9px] text-muted-foreground uppercase">Ida / Vuelta</span>
        )}
      </div>
      <div className="divide-y divide-white/5">
        {legs === 2 && match.legResults ? (
          <>
            {match.legResults.map((leg, idx) => (
              <div key={idx} className="px-1">
                <div className="text-[9px] text-muted-foreground/60 uppercase px-2 pt-1">
                  {idx === 0 ? 'Ida' : 'Vuelta'}
                </div>
                <TeamSlot
                  team={match.home.team}
                  label={match.home.label}
                  score={leg.home}
                  onTeamClick={onTeamClick}
                  getTeamShield={getTeamShield}
                />
                <TeamSlot
                  team={match.away.team}
                  label={match.away.label}
                  score={leg.away}
                  onTeamClick={onTeamClick}
                  getTeamShield={getTeamShield}
                />
              </div>
            ))}
          </>
        ) : (
          <>
            <TeamSlot
              team={match.home.team}
              label={match.home.label}
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
            />
            <TeamSlot
              team={match.away.team}
              label={match.away.label}
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
            />
          </>
        )}
      </div>
    </div>
  );
}

function Connector({ direction = 'right', height = 'h-16' }: { direction?: 'right' | 'left'; height?: string }) {
  return (
    <div className={`hidden md:flex flex-col items-center justify-center ${height} w-8`}>
      <div className="w-full h-px bg-gradient-to-r from-primary/40 to-primary/10" />
    </div>
  );
}

export function PlayoffsView({ onTeamClick }: PlayoffsViewProps) {
  const { getTeamShield } = useTeamImages();

  return (
    <div className="animate-fade-up space-y-8 pb-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Fase Final 2025/26</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text">
          Fase Final de Competición
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Camino a los títulos de Liga y Copa del campeonato Caputbovense.
        </p>
      </div>

      {/* ============== CAMPEONATO DE LIGA ============== */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-primary/20 pb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold">Campeonato de Liga</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Cuadro de eliminatorias por el título
            </p>
          </div>
        </div>

        {/* Classification rule note */}
        <div className="glass-card border-primary/20 p-3 sm:p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-foreground">Clasificación directa</p>
            <p className="text-muted-foreground mt-0.5">
              <span className="text-primary font-bold">1º y 2º</span> de cada grupo se clasifican
              <span className="text-primary font-bold"> directos</span> al Play-off Final de Liga.
            </p>
          </div>
        </div>

        {/* Bracket: SF -> FINAL */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-2">
            {/* Semifinals column */}
            <div className="flex-1 space-y-4">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-1">
                Semifinales
                <div className="text-[9px] text-muted-foreground font-medium normal-case tracking-normal">
                  (a doble partido)
                </div>
              </div>
              <div className="space-y-6 md:space-y-12">
                {leagueBracket.map((m) => (
                  <BracketCard
                    key={m.id}
                    match={m}
                    onTeamClick={onTeamClick}
                    getTeamShield={getTeamShield}
                    accent="primary"
                  />
                ))}
              </div>
            </div>

            {/* Connectors */}
            <div className="hidden md:flex flex-col justify-around items-center w-8 relative">
              <div className="absolute top-[18%] bottom-[18%] left-1/2 w-px bg-primary/30" />
              <div className="absolute top-[18%] left-1/2 right-0 h-px bg-primary/30" />
              <div className="absolute bottom-[18%] left-1/2 right-0 h-px bg-primary/30" />
              <div className="absolute top-1/2 left-1/2 right-0 h-px bg-primary/40" />
              <ChevronRight className="w-4 h-4 text-primary/60 relative z-10" />
            </div>

            {/* Final column */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                Gran Final
                <div className="text-[9px] text-muted-foreground font-medium normal-case tracking-normal">
                  (a doble partido)
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-md" />
                <div className="relative">
                  <BracketCard
                    match={leagueFinal}
                    onTeamClick={onTeamClick}
                    getTeamShield={getTeamShield}
                    accent="primary"
                  />
                </div>
                <div className="text-center mt-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                    <Trophy className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Campeón de Liga
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TORNEO DE COPA ============== */}
      <section className="space-y-4 opacity-95">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-10 h-10 rounded-lg bg-muted/40 border border-white/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-muted-foreground">Torneo de Copa</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground/70">
              Eliminatoria paralela para los clasificados de la zona media
            </p>
          </div>
        </div>

        {/* Classification rule note */}
        <div className="glass-card border-white/10 p-3 sm:p-4 flex items-start gap-3 bg-muted/10">
          <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-muted-foreground">Acceso a Octavos</p>
            <p className="text-muted-foreground/80 mt-0.5">
              Equipos clasificados del <span className="font-bold">3º al 8º</span> de los grupos A y B,
              junto a los del <span className="font-bold">Grupo C</span>.
            </p>
          </div>
        </div>

        {/* Cup bracket: R16 -> QF -> SF -> F */}
        <div className="glass-card p-3 sm:p-5 overflow-x-auto hide-scrollbar">
          <div className="flex gap-3 sm:gap-4 min-w-[860px] md:min-w-0">
            {/* Octavos */}
            <div className="flex-1 space-y-2">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Octavos
              </div>
              <div className="space-y-2">
                {cupR16.map((m) => (
                  <BracketCard
                    key={m.id}
                    match={m}
                    onTeamClick={onTeamClick}
                    getTeamShield={getTeamShield}
                    accent="muted"
                  />
                ))}
              </div>
            </div>

            {/* Cuartos */}
            <div className="flex-1 flex flex-col justify-around space-y-2">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Cuartos
              </div>
              {[1, 2, 3, 4].map((i) => (
                <BracketCard
                  key={`qf-${i}`}
                  match={{
                    id: `qf-${i}`,
                    round: `Cuarto ${i}`,
                    home: { label: `Ganador Octavo ${i * 2 - 1}` },
                    away: { label: `Ganador Octavo ${i * 2}` },
                  }}
                  onTeamClick={onTeamClick}
                  getTeamShield={getTeamShield}
                  accent="muted"
                />
              ))}
            </div>

            {/* Semis */}
            <div className="flex-1 flex flex-col justify-around space-y-2">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Semifinales
              </div>
              {[1, 2].map((i) => (
                <BracketCard
                  key={`sf-${i}`}
                  match={{
                    id: `sf-cup-${i}`,
                    round: `Semifinal ${i}`,
                    home: { label: `Ganador Cuarto ${i * 2 - 1}` },
                    away: { label: `Ganador Cuarto ${i * 2}` },
                  }}
                  onTeamClick={onTeamClick}
                  getTeamShield={getTeamShield}
                  accent="muted"
                />
              ))}
            </div>

            {/* Final */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Final
              </div>
              <BracketCard
                match={{
                  id: 'cup-final',
                  round: 'Final de Copa',
                  home: { label: 'Ganador SF1' },
                  away: { label: 'Ganador SF2' },
                }}
                onTeamClick={onTeamClick}
                getTeamShield={getTeamShield}
                accent="muted"
              />
              <div className="text-center mt-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-white/10">
                  <Award className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Campeón de Copa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground/60 italic">
          Los emparejamientos definitivos se actualizarán al finalizar la fase regular.
        </p>
      </section>
    </div>
  );
}
