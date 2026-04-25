import { Trophy, Award, Shield, Home, Clock, Users } from 'lucide-react';
import { useTeamImages } from '@/hooks/useTeamImages';
import { consolacionTeams } from '@/data/deportividadData';
import { findLivePlayoffMatch } from '@/lib/playoffsLive';
import type { Matchday } from '@/types/league';

interface PlayoffsViewProps {
  onTeamClick?: (teamName: string) => void;
  playoffMatchdays?: Matchday[];
}

interface BracketTeam {
  seed: number;
  team: string;
  fairPlayPoints?: number;
  isHome?: boolean;
}

interface BracketMatch {
  id: string;
  round: string;
  home: BracketTeam | null;
  away: BracketTeam | null;
  placeholderHome?: string;
  placeholderAway?: string;
  score?: { home: number | null; away: number | null };
}

// ============== LIGA: 1º-8º (Cuartos -> Semis -> Final) — PARTIDO ÚNICO ==============
const ligaQuarters: BracketMatch[] = [
  {
    id: 'l-qf1',
    round: 'Cuartos 1',
    home: { seed: 1, team: 'Inter Don Benito Polo Opuesto', fairPlayPoints: 67, isHome: true },
    away: { seed: 8, team: 'Valdehornillos Veteranos', fairPlayPoints: 51 },
    score: { home: null, away: null },
  },
  {
    id: 'l-qf2',
    round: 'Cuartos 2',
    home: { seed: 4, team: 'Santa Amalia Veteranos', fairPlayPoints: 72, isHome: true },
    away: { seed: 5, team: 'Palazuelo Santa Teresa', fairPlayPoints: 44 },
    score: { home: null, away: null },
  },
  {
    id: 'l-qf3',
    round: 'Cuartos 3',
    home: { seed: 3, team: 'Transtello Miajadas', fairPlayPoints: 51, isHome: true },
    away: { seed: 6, team: 'Talarrubias Veteranos', fairPlayPoints: 44 },
    score: { home: null, away: null },
  },
  {
    id: 'l-qf4',
    round: 'Cuartos 4',
    home: { seed: 2, team: 'Meson Los Barros Don Benito', fairPlayPoints: 79, isHome: true },
    away: { seed: 7, team: 'Valdivia Veteranos', fairPlayPoints: 59 },
    score: { home: null, away: null },
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
    score: { home: null, away: null },
  },
  {
    id: 'l-sf2',
    round: 'Semifinal 2',
    home: null,
    away: null,
    placeholderHome: 'Ganador Cuartos 3',
    placeholderAway: 'Ganador Cuartos 4',
    score: { home: null, away: null },
  },
];

const ligaFinal: BracketMatch = {
  id: 'l-final',
  round: 'Gran Final de Liga',
  home: null,
  away: null,
  placeholderHome: 'Ganador Semifinal 1',
  placeholderAway: 'Ganador Semifinal 2',
  score: { home: null, away: null },
};

// ============== COPA: 9º-24º (Octavos -> Cuartos -> Semis -> Final) — PARTIDO ÚNICO ==============
const copaR16: BracketMatch[] = [
  { id: 'c-r16-1', round: 'Octavos 1', home: { seed: 9, team: 'CD Gargaligas', fairPlayPoints: 62, isHome: true }, away: { seed: 24, team: 'Campanario Atletico', fairPlayPoints: 56 }, score: { home: null, away: null } },
  { id: 'c-r16-2', round: 'Octavos 2', home: { seed: 16, team: 'CD Veteranos Ruecas', fairPlayPoints: 47, isHome: true }, away: { seed: 17, team: 'CP Rena', fairPlayPoints: 16 }, score: { home: null, away: null } },
  { id: 'c-r16-3', round: 'Octavos 3', home: { seed: 12, team: 'Agricola Merchan Vva.', fairPlayPoints: 58, isHome: true }, away: { seed: 21, team: 'San Bartolome Veteranos', fairPlayPoints: 46 }, score: { home: null, away: null } },
  { id: 'c-r16-4', round: 'Octavos 4', home: { seed: 13, team: 'AD Alcuescar', fairPlayPoints: 49, isHome: true }, away: { seed: 20, team: 'Zalamea Veteranos', fairPlayPoints: 47 }, score: { home: null, away: null } },
  { id: 'c-r16-5', round: 'Octavos 5', home: { seed: 14, team: 'Vulebar Texeira Don Benito', fairPlayPoints: 86, isHome: true }, away: { seed: 19, team: 'Campanario Interserena', fairPlayPoints: 55 }, score: { home: null, away: null } },
  { id: 'c-r16-6', round: 'Octavos 6', home: { seed: 11, team: 'Sporting Don Benito', fairPlayPoints: 51, isHome: true }, away: { seed: 22, team: 'Docenario Atletico', fairPlayPoints: 41 }, score: { home: null, away: null } },
  { id: 'c-r16-7', round: 'Octavos 7', home: { seed: 15, team: 'Amazonia Orellana', fairPlayPoints: 71, isHome: true }, away: { seed: 18, team: 'V. Bar La Tasca Miajadas', fairPlayPoints: 30 }, score: { home: null, away: null } },
  { id: 'c-r16-8', round: 'Octavos 8', home: { seed: 10, team: 'AD Caputbovense', fairPlayPoints: 70, isHome: true }, away: { seed: 23, team: 'Hernan Cortes Veteranos', fairPlayPoints: 49 }, score: { home: null, away: null } },
];

const copaQuarters: BracketMatch[] = [
  { id: 'c-qf1', round: 'Cuartos 1', home: null, away: null, placeholderHome: 'Ganador Octavos 1', placeholderAway: 'Ganador Octavos 2', score: { home: null, away: null } },
  { id: 'c-qf2', round: 'Cuartos 2', home: null, away: null, placeholderHome: 'Ganador Octavos 3', placeholderAway: 'Ganador Octavos 4', score: { home: null, away: null } },
  { id: 'c-qf3', round: 'Cuartos 3', home: null, away: null, placeholderHome: 'Ganador Octavos 5', placeholderAway: 'Ganador Octavos 6', score: { home: null, away: null } },
  { id: 'c-qf4', round: 'Cuartos 4', home: null, away: null, placeholderHome: 'Ganador Octavos 7', placeholderAway: 'Ganador Octavos 8', score: { home: null, away: null } },
];

const copaSemis: BracketMatch[] = [
  { id: 'c-sf1', round: 'Semifinal 1', home: null, away: null, placeholderHome: 'Ganador Cuartos 1', placeholderAway: 'Ganador Cuartos 2', score: { home: null, away: null } },
  { id: 'c-sf2', round: 'Semifinal 2', home: null, away: null, placeholderHome: 'Ganador Cuartos 3', placeholderAway: 'Ganador Cuartos 4', score: { home: null, away: null } },
];

const copaFinal: BracketMatch = {
  id: 'c-final',
  round: 'Final de Copa',
  home: null,
  away: null,
  placeholderHome: 'Ganador Semifinal 1',
  placeholderAway: 'Ganador Semifinal 2',
  score: { home: null, away: null },
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
      className={`w-full flex items-center gap-2 px-2.5 py-2 hover:bg-white/5 transition-colors text-left disabled:cursor-default group ${
        team?.isHome ? (variant === 'liga' ? 'bg-primary/[0.06]' : 'bg-white/[0.03]') : ''
      }`}
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
      {team?.isHome && (
        <span
          title={`Local · ${team.fairPlayPoints ?? '-'} pts deportividad`}
          className={`flex-shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${
            variant === 'liga'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted-foreground/15 text-foreground/80 border border-white/10'
          }`}
        >
          <Home className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">Local</span>
        </span>
      )}
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
  playoffMatchdays,
}: {
  match: BracketMatch;
  variant: Variant;
  onTeamClick?: (t: string) => void;
  getTeamShield: (t: string) => string | undefined;
  highlight?: boolean;
  playoffMatchdays?: Matchday[];
}) {
  // Live merge: if both teams are known, look up the live match in Firestore
  // playoff matchdays so the bracket reflects admin saves in real time.
  const live =
    match.home && match.away
      ? findLivePlayoffMatch(playoffMatchdays, match.home.team, match.away.team)
      : null;
  const isLive = live?.status === 'LIVE';
  const isFinal = live?.status === 'PLAYED';
  const score =
    live && (isLive || isFinal)
      ? { home: live.homeGoals, away: live.awayGoals }
      : match.score;

  const borderClass =
    variant === 'liga'
      ? highlight
        ? 'border-primary/60 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)]'
        : 'border-primary/25 hover:border-primary/50'
      : 'border-white/10 hover:border-white/25';

  const headerBg = variant === 'liga' ? 'bg-primary/10' : 'bg-white/[0.04]';
  const headerText = variant === 'liga' ? 'text-primary' : 'text-muted-foreground';

  return (
    <div
      className={`glass-card border ${borderClass} overflow-hidden transition-all w-full rounded-lg ${
        isLive ? 'ring-2 ring-destructive/60' : ''
      }`}
    >
      <div className={`px-2.5 py-1 ${headerBg} border-b border-white/5 flex items-center justify-between`}>
        <span className={`text-[9px] font-extrabold uppercase tracking-widest ${headerText}`}>
          {match.round}
        </span>
        {isLive ? (
          <span className="text-[8px] uppercase font-extrabold tracking-wider text-destructive animate-pulse">
            ● EN DIRECTO
          </span>
        ) : isFinal ? (
          <span className="text-[8px] uppercase font-extrabold tracking-wider text-primary">
            FINAL
          </span>
        ) : (
          <span className="text-[8px] text-muted-foreground/70 uppercase font-semibold tracking-wider">
            Partido único
          </span>
        )}
      </div>

      <div className="divide-y divide-white/5">
        <TeamRow
          team={match.home}
          placeholder={match.placeholderHome}
          score={score?.home}
          variant={variant}
          onTeamClick={onTeamClick}
          getTeamShield={getTeamShield}
        />
        <TeamRow
          team={match.away}
          placeholder={match.placeholderAway}
          score={score?.away}
          variant={variant}
          onTeamClick={onTeamClick}
          getTeamShield={getTeamShield}
        />
      </div>
    </div>
  );
}

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
  playoffMatchdays,
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
  playoffMatchdays?: Matchday[];
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
              playoffMatchdays={playoffMatchdays}
            />
            {showRightConnector && (
              <>
                <div className={`hidden md:block absolute top-1/2 -right-3 w-3 h-px ${lineColor}`} />
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

export function PlayoffsView({ onTeamClick, playoffMatchdays }: PlayoffsViewProps) {
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

      {/* Reglamento — Partido único + factor cancha */}
      <div className="glass-card border border-primary/20 p-3 sm:p-4 flex items-start gap-3 max-w-3xl mx-auto">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Home className="w-4 h-4 text-primary" />
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-foreground">Reglamento de eliminatorias</p>
          <p className="text-muted-foreground mt-0.5">
            Todas las eliminatorias se disputan a <span className="text-primary font-bold">partido único</span>.
            El equipo con mayor <span className="text-primary font-bold">puntuación de Deportividad</span> ejerce de local (
            <Home className="inline w-3 h-3 -mt-0.5" /> Local).
          </p>
        </div>
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
              Del 1º al 8º clasificado · Cuartos, Semifinales y Final a partido único
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

        <div className="glass-card p-3 sm:p-6 overflow-x-auto hide-scrollbar">
          <div className="flex items-stretch gap-3 md:gap-8 min-w-[760px] md:min-w-0">
            <BracketColumn
              matches={ligaQuarters}
              variant="liga"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Cuartos de Final"
              subtitle="(partido único)"
              gapClass="gap-3 md:gap-4"
              playoffMatchdays={playoffMatchdays}
            />

            <BracketColumn
              matches={ligaSemis}
              variant="liga"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Semifinales"
              subtitle="(partido único)"
              gapClass="gap-12 md:gap-24"
              playoffMatchdays={playoffMatchdays}
            />

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-center mb-2">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Gran Final
                </div>
                <div className="text-[9px] text-muted-foreground/70 normal-case">
                  (partido único)
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
                    playoffMatchdays={playoffMatchdays}
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
              Del 9º al 24º clasificado · Octavos, Cuartos, Semifinales y Final a partido único
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

        <div className="glass-card p-3 sm:p-5 overflow-x-auto hide-scrollbar">
          <div className="flex items-stretch gap-3 md:gap-6 min-w-[1100px]">
            <BracketColumn
              matches={copaR16}
              variant="copa"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Octavos"
              subtitle="(partido único)"
              gapClass="gap-2"
            />

            <BracketColumn
              matches={copaQuarters}
              variant="copa"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Cuartos"
              subtitle="(partido único)"
              gapClass="gap-10"
            />

            <BracketColumn
              matches={copaSemis}
              variant="copa"
              onTeamClick={onTeamClick}
              getTeamShield={getTeamShield}
              title="Semifinales"
              subtitle="(partido único)"
              gapClass="gap-32"
            />

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-center mb-2">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Final
                </div>
                <div className="text-[9px] text-muted-foreground/70 normal-case">
                  (partido único)
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

      {/* ============== TRIANGULAR COPA CONSOLACIÓN ============== */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
          <div className="w-11 h-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground/90">Triangular Copa Consolación</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Competición especial entre los equipos clasificados 25º, 26º y 27º
            </p>
          </div>
        </div>

        <div className="glass-card border border-amber-500/20 p-3 sm:p-4 flex items-start gap-3 bg-amber-500/[0.04]">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-foreground/90">Modalidad especial</p>
            <p className="text-muted-foreground mt-0.5">
              Triangular a una sola vuelta. Los partidos se disputan en formato reducido de{' '}
              <span className="font-bold text-amber-400">30 minutos</span> por encuentro.
            </p>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {consolacionTeams.map((team, idx) => {
              const shield = getTeamShield(team);
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => onTeamClick?.(team)}
                  className="glass-card border border-amber-500/20 hover:border-amber-500/40 transition-all p-3 sm:p-4 flex flex-col items-center text-center gap-2 group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary/60 flex items-center justify-center overflow-hidden ring-2 ring-amber-500/20">
                    {shield ? (
                      <img src={shield} alt={team} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-6 h-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                    Equipo {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-amber-400 transition-colors leading-tight">
                    {team}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
            <div className="text-[10px] sm:text-xs">
              <div className="text-muted-foreground/70 uppercase tracking-wider text-[9px] mb-0.5">Jornada 1</div>
              <div className="font-semibold text-foreground/80">Equipo 1 vs Equipo 2</div>
            </div>
            <div className="text-[10px] sm:text-xs">
              <div className="text-muted-foreground/70 uppercase tracking-wider text-[9px] mb-0.5">Jornada 2</div>
              <div className="font-semibold text-foreground/80">Equipo 2 vs Equipo 3</div>
            </div>
            <div className="text-[10px] sm:text-xs">
              <div className="text-muted-foreground/70 uppercase tracking-wider text-[9px] mb-0.5">Jornada 3</div>
              <div className="font-semibold text-foreground/80">Equipo 1 vs Equipo 3</div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground/60 italic">
          El campeón del triangular se proclama por puntos acumulados.
        </p>
      </section>
    </div>
  );
}
