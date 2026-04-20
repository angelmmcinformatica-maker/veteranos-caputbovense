import { Trophy, Award, Shield } from 'lucide-react';
import { useTeamImages } from '@/hooks/useTeamImages';

interface PlayoffsViewProps {
  onTeamClick?: (teamName: string) => void;
}

interface BracketTeam {
  seed: number;
  team: string;
}

interface BracketMatch {
  id: string;
  round: string;
  home: BracketTeam | null;
  away: BracketTeam | null;
  placeholderHome?: string;
  placeholderAway?: string;
  legResults?: { home: number | null; away: number | null }[]; // [ida, vuelta]
  aggregate?: { home: number | null; away: number | null };
}

// ============== LIGA: 1º-8º (Cuartos -> Semis -> Final) ==============
const ligaQuarters: BracketMatch[] = [
  {
    id: 'l-qf1',
    round: 'Cuartos 1',
    home: { seed: 1, team: 'Inter Don Benito Polo Opuesto' },
    away: { seed: 8, team: 'Valdehornillos Veteranos' },
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
  {
    id: 'l-qf2',
    round: 'Cuartos 2',
    home: { seed: 4, team: 'Santa Amalia Veteranos' },
    away: { seed: 5, team: 'Palazuelo Santa Teresa' },
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
  {
    id: 'l-qf3',
    round: 'Cuartos 3',
    home: { seed: 3, team: 'Transtello Miajadas' },
    away: { seed: 6, team: 'Talarrubias Veteranos' },
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
  {
    id: 'l-qf4',
    round: 'Cuartos 4',
    home: { seed: 2, team: 'Meson Los Barros Don Benito' },
    away: { seed: 7, team: 'Valdivia Veteranos' },
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
];

const ligaSemis: BracketMatch[] = [
  {
    id: 'l-sf1',
    round: 'Semifinal 1',
    home: null,
    away: null,
    placeholderHome: 'Ganador Cuartos 1',
    placeholderAway: 'Ganador Cuartos 2',
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
  {
    id: 'l-sf2',
    round: 'Semifinal 2',
    home: null,
    away: null,
    placeholderHome: 'Ganador Cuartos 3',
    placeholderAway: 'Ganador Cuartos 4',
    legResults: [{ home: null, away: null }, { home: null, away: null }],
  },
];

const ligaFinal: BracketMatch = {
  id: 'l-final',
  round: 'Gran Final de Liga',
  home: null,
  away: null,
  placeholderHome: 'Ganador Semifinal 1',
  placeholderAway: 'Ganador Semifinal 2',
  legResults: [{ home: null, away: null }, { home: null, away: null }],
};

// ============== COPA: 9º-24º (Octavos -> Cuartos -> Semis -> Final) ==============
const copaR16: BracketMatch[] = [
  // Top half
  { id: 'c-r16-1', round: 'Octavos 1', home: { seed: 9, team: 'CD Gargaligas' }, away: { seed: 24, team: 'Campanario Atletico' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-r16-2', round: 'Octavos 2', home: { seed: 16, team: 'CD Veteranos Ruecas' }, away: { seed: 17, team: 'CP Rena' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-r16-3', round: 'Octavos 3', home: { seed: 12, team: 'Agricola Merchan Vva.' }, away: { seed: 21, team: 'San Bartolome Veteranos' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-r16-4', round: 'Octavos 4', home: { seed: 13, team: 'AD Alcuescar' }, away: { seed: 20, team: 'Zalamea Veteranos' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  // Bottom half
  { id: 'c-r16-5', round: 'Octavos 5', home: { seed: 14, team: 'Vulebar Texeira Don Benito' }, away: { seed: 19, team: 'Campanario Interserena' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-r16-6', round: 'Octavos 6', home: { seed: 11, team: 'Sporting Don Benito' }, away: { seed: 22, team: 'Docenario Atletico' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-r16-7', round: 'Octavos 7', home: { seed: 15, team: 'Amazonia Orellana' }, away: { seed: 18, team: 'V. Bar La Tasca Miajadas' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-r16-8', round: 'Octavos 8', home: { seed: 10, team: 'AD Caputbovense' }, away: { seed: 23, team: 'Hernan Cortes Veteranos' }, legResults: [{ home: null, away: null }, { home: null, away: null }] },
];

const copaQuarters: BracketMatch[] = [
  { id: 'c-qf1', round: 'Cuartos 1', home: null, away: null, placeholderHome: 'Ganador Octavos 1', placeholderAway: 'Ganador Octavos 2', legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-qf2', round: 'Cuartos 2', home: null, away: null, placeholderHome: 'Ganador Octavos 3', placeholderAway: 'Ganador Octavos 4', legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-qf3', round: 'Cuartos 3', home: null, away: null, placeholderHome: 'Ganador Octavos 5', placeholderAway: 'Ganador Octavos 6', legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-qf4', round: 'Cuartos 4', home: null, away: null, placeholderHome: 'Ganador Octavos 7', placeholderAway: 'Ganador Octavos 8', legResults: [{ home: null, away: null }, { home: null, away: null }] },
];

const copaSemis: BracketMatch[] = [
  { id: 'c-sf1', round: 'Semifinal 1', home: null, away: null, placeholderHome: 'Ganador Cuartos 1', placeholderAway: 'Ganador Cuartos 2', legResults: [{ home: null, away: null }, { home: null, away: null }] },
  { id: 'c-sf2', round: 'Semifinal 2', home: null, away: null, placeholderHome: 'Ganador Cuartos 3', placeholderAway: 'Ganador Cuartos 4', legResults: [{ home: null, away: null }, { home: null, away: null }] },
];

const copaFinal: BracketMatch = {
  id: 'c-final',
  round: 'Final de Copa',
  home: null,
  away: null,
  placeholderHome: 'Ganador Semifinal 1',
  placeholderAway: 'Ganador Semifinal 2',
  legResults: [{ home: null, away: null }, { home: null, away: null }],
};

// ============== Components ==============

type Variant = 'liga' | 'copa';

function TeamRow({
  team,
  placeholder,
  score,
  variant,
  onTeamClick,
  getTeamShield,
}: {
  team: BracketTeam | null;
  placeholder?: string;
  score?: number | null;
  variant: Variant;
  onTeamClick?: (t: string) => void;
  getTeamShield: (t: string) => string | undefined;
}) {
  const shield = team ? getTeamShield(team.team) : undefined;
  const isPlaceholder = !team;
  const seedColor = variant === 'liga' ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20 text-muted-foreground';

  return (
    <button
      type="button"
      onClick={() => team && onTeamClick?.(team.team)}
      disabled={!team}
      className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-white/5 transition-colors text-left disabled:cursor-default group"
    >
      {team && (
        <span className={`flex-shrink-0 text-[9px] font-extrabold w-5 h-5 rounded flex items-center justify-center ${seedColor}`}>
          {team.seed}
        </span>
      )}
      <div className="w-6 h-6 flex-shrink-0 rounded-full bg-secondary/60 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
        {shield ? (
          <img src={shield} alt={team?.team || ''} className="w-full h-full object-cover" />
        ) : (
          <Shield className="w-3 h-3 text-muted-foreground/40" />
        )}
      </div>
      <span
        className={`flex-1 text-[11px] sm:text-xs truncate ${
          isPlaceholder
            ? 'text-muted-foreground/60 italic'
            : 'text-foreground font-semibold group-hover:text-primary transition-colors'
        }`}
      >
        {team?.team || placeholder}
      </span>
      <span className="text-xs font-bold tabular-nums text-muted-foreground/70 min-w-[16px] text-right">
        {score ?? '-'}
      </span>
    </button>
  );
}

function MatchCard({
  match,
  variant,
  onTeamClick,
  getTeamShield,
  highlight = false,
}: {
  match: BracketMatch;
  variant: Variant;
  onTeamClick?: (t: string) => void;
  getTeamShield: (t: string) => string | undefined;
  highlight?: boolean;
}) {
  const borderClass =
    variant === 'liga'
      ? highlight
        ? 'border-primary/60 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)]'
        : 'border-primary/25 hover:border-primary/50'
      : 'border-white/10 hover:border-white/25';

  const headerBg = variant === 'liga' ? 'bg-primary/10' : 'bg-white/[0.04]';
  const headerText = variant === 'liga' ? 'text-primary' : 'text-muted-foreground';

  const legs = match.legResults || [];
  const hasLegs = legs.length === 2;

  return (
    <div className={`glass-card border ${borderClass} overflow-hidden transition-all w-full rounded-lg`}>
      <div className={`px-2.5 py-1 ${headerBg} border-b border-white/5 flex items-center justify-between`}>
        <span className={`text-[9px] font-extrabold uppercase tracking-widest ${headerText}`}>
          {match.round}
        </span>
        {hasLegs && (
          <span className="text-[8px] text-muted-foreground/70 uppercase font-semibold tracking-wider">
            Ida · Vuelta
          </span>
        )}
      </div>

      {hasLegs ? (
        <div className="divide-y divide-white/5">
          {legs.map((leg, idx) => (
            <div key={idx} className="relative">
              <div className="absolute left-1 top-1 text-[8px] text-muted-foreground/50 uppercase font-bold">
                {idx === 0 ? 'I' : 'V'}
              </div>
              <TeamRow
                team={match.home}
                placeholder={match.placeholderHome}
                score={leg.home}
                variant={variant}
                onTeamClick={onTeamClick}
                getTeamShield={getTeamShield}
              />
              <TeamRow
                team={match.away}
                placeholder={match.placeholderAway}
                score={leg.away}
                variant={variant}
                onTeamClick={onTeamClick}
                getTeamShield={getTeamShield}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          <TeamRow team={match.home} placeholder={match.placeholderHome} variant={variant} onTeamClick={onTeamClick} getTeamShield={getTeamShield} />
          <TeamRow team={match.away} placeholder={match.placeholderAway} variant={variant} onTeamClick={onTeamClick} getTeamShield={getTeamShield} />
        </div>
      )}
    </div>
  );
}

/**
 * Bracket connector lines drawn with absolute positioning.
 * Each pair of consecutive matches in a column connects to ONE match in the next column.
 */
function BracketColumn({
  matches,
  variant,
  onTeamClick,
  getTeamShield,
  title,
  subtitle,
  gapClass = 'gap-4',
  showRightConnector = true,
  highlightAll = false,
}: {
  matches: BracketMatch[];
  variant: Variant;
  onTeamClick?: (t: string) => void;
  getTeamShield: (t: string) => string | undefined;
  title: string;
  subtitle?: string;
  gapClass?: string;
  showRightConnector?: boolean;
  highlightAll?: boolean;
}) {
  const lineColor = variant === 'liga' ? 'bg-primary/40' : 'bg-white/20';
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="text-center mb-2">
        <div className={`text-[10px] font-extrabold uppercase tracking-widest ${variant === 'liga' ? 'text-primary' : 'text-muted-foreground'}`}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[9px] text-muted-foreground/60 font-medium normal-case">
            {subtitle}
          </div>
        )}
      </div>
      <div className={`flex-1 flex flex-col justify-around ${gapClass}`}>
        {matches.map((m, i) => (
          <div key={m.id} className="relative">
            <MatchCard
              match={m}
              variant={variant}
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              highlight={highlightAll}
            />
            {showRightConnector && (
              <>
                {/* Horizontal line out of the card */}
                <div className={`hidden md:block absolute top-1/2 -right-3 w-3 h-px ${lineColor}`} />
                {/* Vertical connector: even index goes down, odd goes up to meet a sibling */}
                {i % 2 === 0 && (
                  <div
                    className={`hidden md:block absolute top-1/2 -right-3 w-px ${lineColor}`}
                    style={{ height: 'calc(50% + 0.5rem)' }}
                  />
                )}
                {i % 2 === 1 && (
                  <div
                    className={`hidden md:block absolute -right-3 w-px ${lineColor}`}
                    style={{ bottom: '50%', height: 'calc(50% + 0.5rem)' }}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChampionBadge({ variant }: { variant: Variant }) {
  const isLiga = variant === 'liga';
  return (
    <div className="text-center mt-3">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
          isLiga
            ? 'bg-primary/15 border border-primary/40'
            : 'bg-muted/40 border border-white/15'
        }`}
      >
        {isLiga ? (
          <Trophy className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Award className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span
          className={`text-[10px] font-extrabold uppercase tracking-widest ${
            isLiga ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {isLiga ? 'Campeón de Liga' : 'Campeón de Copa'}
        </span>
      </div>
    </div>
  );
}

export function PlayoffsView({ onTeamClick }: PlayoffsViewProps) {
  const { getTeamShield } = useTeamImages();

  return (
    <div className="animate-fade-up space-y-10 pb-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Fase Final 2025/26
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text">
          Fase Final de Competición
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Camino a los títulos de Liga y Copa del campeonato Caputbovense.
        </p>
      </div>

      {/* ============== PLAY-OFF LIGA ============== */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-primary/20 pb-3">
          <div className="w-11 h-11 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold">Play-off Liga</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Del 1º al 8º clasificado · Cuartos, Semifinales y Final a doble partido
            </p>
          </div>
        </div>

        <div className="glass-card border-primary/20 p-3 sm:p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-foreground">Clasificación directa</p>
            <p className="text-muted-foreground mt-0.5">
              Los <span className="text-primary font-bold">8 primeros</span> de la clasificación general acceden al Play-off por el título.
            </p>
          </div>
        </div>

        {/* Bracket Tree */}
        <div className="glass-card p-3 sm:p-6 overflow-x-auto hide-scrollbar">
          <div className="flex items-stretch gap-3 md:gap-8 min-w-[760px] md:min-w-0">
            <BracketColumn
              matches={ligaQuarters}
              variant="liga"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Cuartos de Final"
              subtitle="(a doble partido)"
              gapClass="gap-3 md:gap-4"
            />

            <BracketColumn
              matches={ligaSemis}
              variant="liga"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Semifinales"
              subtitle="(a doble partido)"
              gapClass="gap-12 md:gap-24"
            />

            {/* Final column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-center mb-2">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Gran Final
                </div>
                <div className="text-[9px] text-muted-foreground/70 normal-case">
                  (a doble partido)
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-lg" />
                <div className="relative">
                  <MatchCard
                    match={ligaFinal}
                    variant="liga"
                    onTeamClick={onTeamClick}
                    getTeamShield={getTeamShield}
                    highlight
                  />
                </div>
                <ChampionBadge variant="liga" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PLAY-OFF COPA ============== */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-11 h-11 rounded-lg bg-muted/40 border border-white/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground/90">Play-off Copa</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Del 9º al 24º clasificado · Octavos, Cuartos, Semifinales y Final
            </p>
          </div>
        </div>

        <div className="glass-card border-white/10 p-3 sm:p-4 flex items-start gap-3 bg-muted/10">
          <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-foreground/90">Acceso al cuadro</p>
            <p className="text-muted-foreground mt-0.5">
              16 equipos clasificados del <span className="font-bold text-foreground">9º al 24º</span> de la tabla general. Cruces emparejados por puesto (9 vs 24, 10 vs 23, etc.).
            </p>
          </div>
        </div>

        {/* Bracket Tree */}
        <div className="glass-card p-3 sm:p-5 overflow-x-auto hide-scrollbar">
          <div className="flex items-stretch gap-3 md:gap-6 min-w-[1100px]">
            <BracketColumn
              matches={copaR16}
              variant="copa"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Octavos"
              gapClass="gap-2"
            />

            <BracketColumn
              matches={copaQuarters}
              variant="copa"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Cuartos"
              gapClass="gap-10"
            />

            <BracketColumn
              matches={copaSemis}
              variant="copa"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Semifinales"
              gapClass="gap-32"
            />

            {/* Final column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-center mb-2">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Final
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 bg-muted/30 rounded-xl blur-lg" />
                <div className="relative">
                  <MatchCard
                    match={copaFinal}
                    variant="copa"
                    onTeamClick={onTeamClick}
                    getTeamShield={getTeamShield}
                  />
                </div>
                <ChampionBadge variant="copa" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground/60 italic">
          Los emparejamientos se actualizarán automáticamente al finalizar la fase regular.
        </p>
      </section>
    </div>
  );
}
