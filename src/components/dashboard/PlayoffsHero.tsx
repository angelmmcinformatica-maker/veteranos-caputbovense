import { useMemo } from 'react';
import { Trophy, Home, ArrowRight, Shield, Hourglass } from 'lucide-react';
import { useTeamImages } from '@/hooks/useTeamImages';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { findLivePlayoffMatch } from '@/lib/playoffsLive';
import { decideHomeByFairPlay, getFairPlayPoints } from '@/lib/playoffsAdvance';
import type { Matchday } from '@/types/league';

type Competition = 'liga' | 'copa';

interface BaseMatch {
  id: string;
  competition: Competition;
  // For first-round matches: real teams are known up front.
  // For downstream rounds: teams are derived from parent winners.
  staticHome?: string;
  staticAway?: string;
  // Parents for cascading derivation
  parents?: [string, string];
}

interface RoundDef {
  key: string;
  title: string; // e.g. "CUARTOS DE LIGA"
  competition: Competition;
  accent: string;
  matches: BaseMatch[];
}

// ============== LIGA ==============
const LIGA_ROUNDS: RoundDef[] = [
  {
    key: 'liga-cuartos',
    title: 'CUARTOS DE LIGA',
    competition: 'liga',
    accent: 'from-amber-400 to-orange-500',
    matches: [
      { id: 'l-qf1', competition: 'liga', staticHome: 'Inter Don Benito Polo Opuesto', staticAway: 'Valdehornillos Veteranos' },
      { id: 'l-qf2', competition: 'liga', staticHome: 'Santa Amalia Veteranos', staticAway: 'Palazuelo Santa Teresa' },
      { id: 'l-qf3', competition: 'liga', staticHome: 'Transtello Miajadas', staticAway: 'Talarrubias Veteranos' },
      { id: 'l-qf4', competition: 'liga', staticHome: 'Meson Los Barros Don Benito', staticAway: 'Valdivia Veteranos' },
    ],
  },
  {
    key: 'liga-semis',
    title: 'SEMIFINALES DE LIGA',
    competition: 'liga',
    accent: 'from-amber-400 to-orange-500',
    matches: [
      { id: 'l-sf1', competition: 'liga', parents: ['l-qf1', 'l-qf2'] },
      { id: 'l-sf2', competition: 'liga', parents: ['l-qf3', 'l-qf4'] },
    ],
  },
  {
    key: 'liga-final',
    title: 'GRAN FINAL DE LIGA',
    competition: 'liga',
    accent: 'from-amber-400 to-orange-500',
    matches: [
      { id: 'l-final', competition: 'liga', parents: ['l-sf1', 'l-sf2'] },
    ],
  },
];

// ============== COPA ==============
const COPA_ROUNDS: RoundDef[] = [
  {
    key: 'copa-octavos',
    title: 'OCTAVOS DE COPA',
    competition: 'copa',
    accent: 'from-slate-400 to-slate-300',
    matches: [
      { id: 'c-r16-1', competition: 'copa', staticHome: 'CD Gargaligas', staticAway: 'Campanario Atletico' },
      { id: 'c-r16-2', competition: 'copa', staticHome: 'CD Veteranos Ruecas', staticAway: 'CP Rena' },
      { id: 'c-r16-3', competition: 'copa', staticHome: 'Agricola Merchan Vva.', staticAway: 'San Bartolome Veteranos' },
      { id: 'c-r16-4', competition: 'copa', staticHome: 'AD Alcuescar', staticAway: 'Zalamea Veteranos' },
      { id: 'c-r16-5', competition: 'copa', staticHome: 'Vulebar Texeira Don Benito', staticAway: 'Campanario Interserena' },
      { id: 'c-r16-6', competition: 'copa', staticHome: 'Sporting Don Benito', staticAway: 'Docenario Atletico' },
      { id: 'c-r16-7', competition: 'copa', staticHome: 'Amazonia Orellana', staticAway: 'V. Bar La Tasca Miajadas' },
      { id: 'c-r16-8', competition: 'copa', staticHome: 'AD Caputbovense', staticAway: 'Hernan Cortes Veteranos' },
    ],
  },
  {
    key: 'copa-cuartos',
    title: 'CUARTOS DE COPA',
    competition: 'copa',
    accent: 'from-slate-400 to-slate-300',
    matches: [
      { id: 'c-qf1', competition: 'copa', parents: ['c-r16-1', 'c-r16-2'] },
      { id: 'c-qf2', competition: 'copa', parents: ['c-r16-3', 'c-r16-4'] },
      { id: 'c-qf3', competition: 'copa', parents: ['c-r16-5', 'c-r16-6'] },
      { id: 'c-qf4', competition: 'copa', parents: ['c-r16-7', 'c-r16-8'] },
    ],
  },
  {
    key: 'copa-semis',
    title: 'SEMIFINALES DE COPA',
    competition: 'copa',
    accent: 'from-slate-400 to-slate-300',
    matches: [
      { id: 'c-sf1', competition: 'copa', parents: ['c-qf1', 'c-qf2'] },
      { id: 'c-sf2', competition: 'copa', parents: ['c-qf3', 'c-qf4'] },
    ],
  },
  {
    key: 'copa-final',
    title: 'FINAL DE COPA',
    competition: 'copa',
    accent: 'from-slate-400 to-slate-300',
    matches: [
      { id: 'c-final', competition: 'copa', parents: ['c-sf1', 'c-sf2'] },
    ],
  },
];

// Flat index to look up any match by id (for parent resolution)
const ALL_MATCHES_INDEX: Record<string, BaseMatch> = {};
[...LIGA_ROUNDS, ...COPA_ROUNDS].forEach((r) =>
  r.matches.forEach((m) => {
    ALL_MATCHES_INDEX[m.id] = m;
  })
);

// Recursively resolve the winner of a static match id by reading live data,
// cascading through parents when needed.
function resolveWinner(
  id: string,
  playoffMatchdays: Matchday[] | undefined,
  cache: Record<string, string | null | undefined>
): string | null {
  if (cache[id] !== undefined) return cache[id] ?? null;
  cache[id] = null; // cycle guard

  const m = ALL_MATCHES_INDEX[id];
  if (!m) return null;

  let homeName: string | null = null;
  let awayName: string | null = null;

  if (m.parents) {
    const winA = resolveWinner(m.parents[0], playoffMatchdays, cache);
    const winB = resolveWinner(m.parents[1], playoffMatchdays, cache);
    if (!winA || !winB) return null;
    const { home, away } = decideHomeByFairPlay(winA, winB);
    homeName = home;
    awayName = away;
  } else {
    homeName = m.staticHome ?? null;
    awayName = m.staticAway ?? null;
  }

  if (!homeName || !awayName) return null;
  const live = findLivePlayoffMatch(playoffMatchdays, homeName, awayName);
  if (!live || live.status !== 'PLAYED') return null;
  const hg = live.homeGoals ?? 0;
  const ag = live.awayGoals ?? 0;
  if (hg === ag) return null;
  const winner = hg > ag ? homeName : awayName;
  cache[id] = winner;
  return winner;
}

// Resolve the current participants of any match (real teams or null = waiting).
function resolveParticipants(
  id: string,
  playoffMatchdays: Matchday[] | undefined,
  cache: Record<string, string | null | undefined>
): { home: string | null; away: string | null } {
  const m = ALL_MATCHES_INDEX[id];
  if (!m) return { home: null, away: null };

  if (!m.parents) {
    return { home: m.staticHome ?? null, away: m.staticAway ?? null };
  }

  const winA = resolveWinner(m.parents[0], playoffMatchdays, cache);
  const winB = resolveWinner(m.parents[1], playoffMatchdays, cache);

  if (winA && winB) {
    const { home, away } = decideHomeByFairPlay(winA, winB);
    return { home, away };
  }
  // Only one decided so far → put the known one as home, leave the other waiting.
  if (winA && !winB) return { home: winA, away: null };
  if (!winA && winB) return { home: winB, away: null };
  return { home: null, away: null };
}

// A round is "complete" when all of its matches have a resolved winner.
function isRoundComplete(
  round: RoundDef,
  playoffMatchdays: Matchday[] | undefined,
  cache: Record<string, string | null | undefined>
): boolean {
  return round.matches.every((m) => resolveWinner(m.id, playoffMatchdays, cache) !== null);
}

// Pick the active round per competition: the first round (in order) that
// is NOT complete. If every round is complete, fall back to the last round.
function pickActiveRound(
  rounds: RoundDef[],
  playoffMatchdays: Matchday[] | undefined,
  cache: Record<string, string | null | undefined>
): RoundDef {
  for (const r of rounds) {
    if (!isRoundComplete(r, playoffMatchdays, cache)) return r;
  }
  return rounds[rounds.length - 1];
}

interface PlayoffsHeroProps {
  onNavigate: () => void;
  onTeamClick?: (teamName: string) => void;
  playoffMatchdays?: Matchday[];
}

export function PlayoffsHero({ onNavigate, onTeamClick, playoffMatchdays }: PlayoffsHeroProps) {
  const { getTeamShield } = useTeamImages();

  // Determine the active round for each competition using a shared resolution cache.
  const { ligaRound, copaRound } = useMemo(() => {
    const cache: Record<string, string | null | undefined> = {};
    return {
      ligaRound: pickActiveRound(LIGA_ROUNDS, playoffMatchdays, cache),
      copaRound: pickActiveRound(COPA_ROUNDS, playoffMatchdays, cache),
    };
  }, [playoffMatchdays]);

  // Resolve participants for every match in the active rounds (single shared cache).
  const enriched = useMemo(() => {
    const cache: Record<string, string | null | undefined> = {};
    const enrich = (round: RoundDef) =>
      round.matches.map((m) => {
        const { home, away } = resolveParticipants(m.id, playoffMatchdays, cache);
        const homePoints = home ? getFairPlayPoints(home) : 0;
        const awayPoints = away ? getFairPlayPoints(away) : 0;
        // Determine "isHome" badge: real LOCAL is the side that's actually the home team.
        // For first-round matches use staticHome; for derived matches the resolved home
        // already comes from decideHomeByFairPlay so it IS the local.
        return {
          id: m.id,
          competition: m.competition,
          home,
          away,
          homePoints,
          awayPoints,
          // Always mark resolved 'home' as LOCAL (Fair Play already decided it)
          homeIsLocal: !!home,
        };
      });
    return {
      liga: enrich(ligaRound),
      copa: enrich(copaRound),
    };
  }, [ligaRound, copaRound, playoffMatchdays]);

  const TeamRow = ({
    name,
    points,
    isLocal,
  }: {
    name: string | null;
    points: number;
    isLocal: boolean;
  }) => {
    if (!name) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-secondary/40 flex items-center justify-center flex-shrink-0">
            <Hourglass className="w-3.5 h-3.5 text-muted-foreground/70" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm leading-tight italic text-muted-foreground/70">
              Esperando rival...
            </span>
          </div>
        </div>
      );
    }
    const shield = getTeamShield(name);
    return (
      <div className={cn('flex items-center gap-2 min-w-0', isLocal && 'font-semibold')}>
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
            {isLocal && (
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

  const sections = [
    { label: ligaRound.title, items: enriched.liga, accent: ligaRound.accent, competition: 'liga' as const },
    { label: copaRound.title, items: enriched.copa, accent: copaRound.accent, competition: 'copa' as const },
  ];

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

      {/* Sections: only the ACTIVE round per competition */}
      {sections.map((section) => (
        <div key={section.label} className="relative mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('h-[2px] w-6 rounded bg-gradient-to-r', section.accent)} />
            <h3 className="text-[11px] sm:text-xs font-bold tracking-[0.15em] text-foreground/80">
              {section.label}
            </h3>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              ({section.items.length} {section.items.length === 1 ? 'partido' : 'partidos'})
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Mobile: horizontal scroll carousel. Tablet+: responsive grid */}
          <div className="-mx-1 px-1 flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden">
            {section.items.map((m) => {
              const live =
                m.home && m.away
                  ? findLivePlayoffMatch(playoffMatchdays, m.home, m.away)
                  : null;
              const showScore = live && (live.status === 'PLAYED' || live.status === 'LIVE');
              const isLive = live?.status === 'LIVE';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={onNavigate}
                  className={cn(
                    'group text-left rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-lg snap-start',
                    'shrink-0 w-[78%] md:w-auto',
                    m.competition === 'liga'
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
                      : 'border-slate-400/30 bg-slate-400/5 hover:border-slate-400/60',
                    isLive && 'ring-2 ring-destructive/60'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      m.competition === 'liga'
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-slate-400/20 text-slate-300'
                    )}>
                      {section.label}
                    </span>
                    {isLive ? (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive animate-pulse">
                        ● EN DIRECTO
                      </span>
                    ) : showScore ? (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                        FINAL
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <TeamRow name={m.home} points={m.homePoints} isLocal={m.homeIsLocal && !!m.home} />
                      </div>
                      {showScore && (
                        <span className="text-lg font-extrabold tabular-nums text-foreground flex-shrink-0">
                          {live!.homeGoals}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] text-muted-foreground font-medium">VS</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <TeamRow name={m.away} points={m.awayPoints} isLocal={false} />
                      </div>
                      {showScore && (
                        <span className="text-lg font-extrabold tabular-nums text-foreground flex-shrink-0">
                          {live!.awayGoals}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

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
