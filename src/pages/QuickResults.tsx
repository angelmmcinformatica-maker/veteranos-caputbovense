import { hasConfirmedScore } from '@/lib/matchScore';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, Minus, Plus, Radio, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { useLeagueData } from '@/hooks/useLeagueData';
import { useTeamImages } from '@/hooks/useTeamImages';
import { matchdaysCollectionName, reportsCollectionName } from '@/config/seasons';
import { TeamShield } from '@/components/teams/TeamShield';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Match, Matchday, MatchReportPlayer } from '@/types/league';

type Status = 'PENDING' | 'LIVE' | 'PLAYED';
const statusLabel: Record<string, string> = { PENDING: 'Pendiente', SCHEDULED: 'Pendiente', LIVE: 'En directo', PLAYED: 'Finalizado', POSTPONED: 'Aplazado' };

function Counter({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <span className="sr-only">{label}</span>
      <Button type="button" size="icon" variant="secondary" className="h-14 w-14" aria-label={`Sumar gol ${label}`} onClick={() => onChange(value + 1)}><Plus className="size-6" /></Button>
      <input type="number" inputMode="numeric" min={0} aria-label={`Goles ${label}`} value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
        className="w-20 h-16 text-center text-4xl font-bold tabular-nums rounded-lg bg-secondary border border-border" />
      <Button type="button" size="icon" variant="secondary" className="h-14 w-14" aria-label={`Restar gol ${label}`} onClick={() => onChange(Math.max(0, value - 1))}><Minus className="size-6" /></Button>
    </div>
  );
}

export default function QuickResults() {
  const { currentUser, userData, loading: authLoading, isAdmin } = useAuth();
  const { isReadOnly, season } = useSeason();
  const { matchdays, teams, matchReports, nextMatchday, loading } = useLeagueData();
  const { getTeamShield } = useTeamImages();
  const [sel, setSel] = useState<{ match: Match; matchday: Matchday } | null>(null);
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);
  const [status, setStatus] = useState<Status>('PENDING');
  const [scorerTeam, setScorerTeam] = useState('');
  const [scorer, setScorer] = useState('');
  const [minute, setMinute] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const current = useMemo(() => {
    const live = matchdays.find((md) => md.matches?.some((m) => m.status === 'LIVE'));
    return live ?? nextMatchday ?? matchdays[matchdays.length - 1] ?? null;
  }, [matchdays, nextMatchday]);

  const list = useMemo(() => {
    const src = showAll ? matchdays : current ? [current] : [];
    const rank = (s: string) => (s === 'LIVE' ? 0 : s === 'PENDING' || s === 'SCHEDULED' ? 1 : 2);
    return src.flatMap((md) => (md.matches ?? []).map((m) => ({ match: m, matchday: md })))
      .sort((a, b) => rank(a.match.status) - rank(b.match.status));
  }, [showAll, matchdays, current]);

  const open = (match: Match, matchday: Matchday) => {
    setSel({ match, matchday });
    setHome(match.homeGoals || 0); setAway(match.awayGoals || 0);
    setStatus(match.status === 'LIVE' || match.status === 'PLAYED' ? match.status : 'PENDING');
    setScorerTeam(''); setScorer(''); setMinute(''); setMsg(null);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!currentUser || !userData || !isAdmin) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden p-4 flex items-center justify-center">
        <div className="glass-card p-6 w-full max-w-sm text-center space-y-4">
          <Lock className="size-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Carga rápida</h1>
          <p className="text-sm text-muted-foreground">Acceso solo para administradores. Inicia sesión en Admin y vuelve a esta dirección.</p>
          <Button asChild className="w-full h-12"><Link to="/?tab=admin">Ir a Admin</Link></Button>
        </div>
      </main>
    );
  }

  const hadResult = sel && hasConfirmedScore(sel.match);
  const scorerRoster = teams.find((t) => t.name === scorerTeam)?.players ?? [];

  const save = async () => {
    if (!sel) return;
    setSaving(true); setMsg(null);
    try {
      const ref = doc(db, matchdaysCollectionName(), sel.matchday.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Jornada no encontrada');
      const matches = (snap.data().matches ?? []) as Match[];
      if (!matches.some((m) => m.home === sel.match.home && m.away === sel.match.away)) throw new Error('Partido no encontrado');
      await updateDoc(ref, {
        matches: matches.map((m) => (m.home === sel.match.home && m.away === sel.match.away ? { ...m, homeGoals: home, awayGoals: away, status, autoLive: false } : m)),
      });
      if (scorerTeam && scorer.trim()) {
        const reportId = `${sel.match.home}-${sel.match.away}`;
        const rRef = doc(db, reportsCollectionName(), reportId);
        const rSnap = await getDoc(rRef);
        const teamData = (rSnap.exists() ? (rSnap.data() as any)[scorerTeam] : null) ?? {};
        const players: MatchReportPlayer[] = Array.isArray(teamData.players) ? [...teamData.players] : [];
        const idx = players.findIndex((p) => p.name === scorer);
        const min = minute.trim();
        if (idx >= 0) {
          const p = players[idx];
          players[idx] = { ...p, goals: (Number(p.goals) || 0) + 1, goalMin: min ? [p.goalMin, min].filter(Boolean).join(', ') : p.goalMin || '' };
        } else {
          const rp = scorerRoster.find((p) => p.name === scorer);
          players.push({ id: rp?.id ?? scorer, name: scorer, alias: rp?.alias || '', matchNumber: '', isStarting: true, substitutionMin: '', goals: 1, ownGoals: 0, yellowCards: 0, redCards: 0, directRedCards: 0, goalMin: min, cardMin: '' });
        }
        await setDoc(rRef, { id: reportId, [scorerTeam]: { ...teamData, players } }, { merge: true });
      }
      setMsg({ ok: true, text: `Guardado: ${sel.match.home} ${home} - ${away} ${sel.match.away} (${statusLabel[status]})` });
      setSel((s) => (s ? { ...s, match: { ...s.match, homeGoals: home, awayGoals: away, status } } : s));
      setScorer(''); setMinute('');
    } catch (e) {
      setMsg({ ok: false, text: 'No se pudo guardar: ' + (e instanceof Error ? e.message : 'error desconocido') });
    } finally {
      setSaving(false); setConfirm(false);
    }
  };

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        {sel ? (
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Volver a la lista" onClick={() => { setSel(null); setMsg(null); }}><ArrowLeft className="size-5" /></Button>
        ) : (
          <Button asChild variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Volver a Admin"><Link to="/?tab=admin"><ArrowLeft className="size-5" /></Link></Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">Carga rápida</h1>
          <p className="text-xs text-muted-foreground truncate">{season?.label}</p>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {isReadOnly && (
          <div className="glass-card p-3 border border-warning/30 text-sm">Temporada archivada: solo lectura. Cambia a la temporada actual para cargar resultados.</div>
        )}
        {msg && (
          <div role="status" className={`p-3 rounded-lg border text-sm flex gap-2 items-start ${msg.ok ? 'bg-primary/10 border-primary/30' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
            {msg.ok ? <CheckCircle2 className="size-5 shrink-0 text-primary" /> : <AlertTriangle className="size-5 shrink-0" />}
            <span className="min-w-0 break-words">{msg.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : !sel ? (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-semibold">{showAll ? 'Todas las jornadas' : current ? `Jornada ${current.jornada} · ${current.date}` : 'Sin jornadas'}</h2>
              <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Solo jornada actual' : 'Ver todas'}</Button>
            </div>
            <ul className="space-y-3">
              {list.map(({ match: m, matchday: md }) => (
                <li key={`${md.id}-${m.home}-${m.away}`}>
                  <button onClick={() => open(m, md)} disabled={isReadOnly}
                    className="glass-card-hover w-full p-4 text-left disabled:opacity-60">
                    <div className="flex justify-between gap-2 text-xs text-muted-foreground mb-2">
                      <span className="truncate">J{md.jornada} · {m.date || md.date} {m.time || ''}</span>
                      <span className={`shrink-0 font-semibold ${m.status === 'LIVE' ? 'text-destructive' : m.status === 'PLAYED' ? 'text-primary' : ''}`}>{statusLabel[m.status] ?? m.status}</span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0"><TeamShield name={m.home} src={getTeamShield(m.home)} className="size-8" /><span className="text-sm font-medium break-words min-w-0">{m.home}</span></div>
                      <span className="text-xl font-bold tabular-nums">{hasConfirmedScore(m) ? `${m.homeGoals} - ${m.awayGoals}` : m.status === 'LIVE' ? 'Pendiente' : 'vs'}</span>
                      <div className="flex items-center gap-2 min-w-0 justify-end text-right"><span className="text-sm font-medium break-words min-w-0">{m.away}</span><TeamShield name={m.away} src={getTeamShield(m.away)} className="size-8" /></div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">Jornada {sel.matchday.jornada} · {sel.match.date || sel.matchday.date} {sel.match.time}</p>
            {hadResult && (
              <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-sm">
                Este partido ya tiene resultado ({sel.match.homeGoals} - {sel.match.awayGoals}, {statusLabel[sel.match.status]}). Al guardar se modificará.
              </div>
            )}
            <div className="glass-card p-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <div className="flex flex-col items-center gap-2 min-w-0 text-center">
                <TeamShield name={sel.match.home} src={getTeamShield(sel.match.home)} className="size-12" />
                <span className="text-sm font-semibold break-words w-full">{sel.match.home}</span>
                <Counter value={home} onChange={setHome} label="local" />
              </div>
              <span className="text-2xl font-bold">-</span>
              <div className="flex flex-col items-center gap-2 min-w-0 text-center">
                <TeamShield name={sel.match.away} src={getTeamShield(sel.match.away)} className="size-12" />
                <span className="text-sm font-semibold break-words w-full">{sel.match.away}</span>
                <Counter value={away} onChange={setAway} label="visitante" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['PENDING', 'LIVE', 'PLAYED'] as Status[]).map((s) => (
                <Button key={s} type="button" variant={status === s ? 'default' : 'secondary'} className="h-14 flex-col gap-0.5 text-xs" onClick={() => setStatus(s)}>
                  {s === 'LIVE' ? <Radio className="size-4" /> : s === 'PLAYED' ? <CheckCircle2 className="size-4" /> : null}
                  {statusLabel[s]}
                </Button>
              ))}
            </div>

            <details className="glass-card p-4">
              <summary className="font-semibold cursor-pointer">Goleador y minuto (opcional)</summary>
              <div className="mt-3 space-y-3">
                <select aria-label="Equipo del goleador" value={scorerTeam} onChange={(e) => { setScorerTeam(e.target.value); setScorer(''); }} className="w-full h-12 rounded-lg bg-secondary border border-border px-3">
                  <option value="">Equipo…</option>
                  <option value={sel.match.home}>{sel.match.home}</option>
                  <option value={sel.match.away}>{sel.match.away}</option>
                </select>
                {scorerTeam && (scorerRoster.length ? (
                  <select aria-label="Goleador" value={scorer} onChange={(e) => setScorer(e.target.value)} className="w-full h-12 rounded-lg bg-secondary border border-border px-3">
                    <option value="">Jugador…</option>
                    {scorerRoster.map((p) => <option key={String(p.id)} value={p.name}>{p.name}</option>)}
                  </select>
                ) : (
                  <input aria-label="Goleador" placeholder="Nombre del goleador" value={scorer} onChange={(e) => setScorer(e.target.value)} className="w-full h-12 rounded-lg bg-secondary border border-border px-3" />
                ))}
                <input aria-label="Minuto" inputMode="numeric" placeholder="Minuto (ej. 14)" value={minute} onChange={(e) => setMinute(e.target.value.replace(/[^0-9+]/g, '').slice(0, 5))} className="w-full h-12 rounded-lg bg-secondary border border-border px-3" />
                <p className="text-xs text-muted-foreground">Se añade un gol al jugador en el acta, sin borrar el resto.</p>
              </div>
            </details>

            <Button className="w-full h-14 text-base" disabled={saving || isReadOnly} onClick={() => setConfirm(true)}>
              {saving ? <Loader2 className="size-5 animate-spin" /> : 'Guardar resultado'}
            </Button>
            <Button variant="outline" className="w-full h-12" onClick={() => { setSel(null); setMsg(null); }}>Volver a la lista</Button>
          </div>
        )}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{hadResult ? '¿Modificar resultado?' : '¿Guardar resultado?'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground break-words">{sel?.match.home} {home} - {away} {sel?.match.away}</p>
                <p>Estado: {statusLabel[status]}</p>
                {hadResult && <p>Antes: {sel?.match.homeGoals} - {sel?.match.awayGoals} ({statusLabel[sel?.match.status ?? '']})</p>}
                {scorerTeam && scorer && <p>Gol de {scorer}{minute ? ` (${minute}')` : ''}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="h-12" onClick={(e) => { e.preventDefault(); save(); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
