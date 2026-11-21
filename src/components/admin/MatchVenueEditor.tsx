import { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { MapPin, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext';
import { matchdaysCollectionName } from '@/config/seasons';
import { replaceMatchVenue, resolveMatchVenue, withConfirmedMatchVenue } from '@/lib/matchVenue';
import { MatchVenueInfo } from '@/components/matches/MatchVenueInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Match, Matchday, Team } from '@/types/league';

export function MatchVenueEditor({ match, matchday, homeTeam }: { match: Match; matchday: Matchday; homeTeam?: Team }) {
  const { currentUser, userData, isAdmin } = useAuth();
  const { seasonId, isReadOnly } = useSeason();
  const enrichedMatch = withConfirmedMatchVenue(match, seasonId, matchday.jornada);
  const initial = enrichedMatch.venue ?? resolveMatchVenue(enrichedMatch, homeTeam, seasonId);
  const [name, setName] = useState(initial?.name ?? '');
  const [locality, setLocality] = useState(initial?.locality ?? '');
  const [confirmed, setConfirmed] = useState(initial?.confirmed === true);
  const [habitual, setHabitual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const venue = { name: name.trim(), locality: locality.trim(), confirmed };
  if (!isAdmin || !currentUser || !userData || isReadOnly) return null;

  const save = async () => {
    if (!isAdmin || !currentUser || !userData || isReadOnly || saving) return;
    if (confirmed && (!venue.name || !venue.locality)) {
      setMessage('Indica el campo exacto y la población antes de confirmarlo.'); return;
    }
    setSaving(true); setMessage('');
    try {
      const matchdayRef = doc(db, matchdaysCollectionName(seasonId), matchday.id);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(matchdayRef);
        if (!snapshot.exists()) throw new Error('Jornada no encontrada');
        const matches = (snapshot.data().matches ?? []) as Match[];
        const index = matches.findIndex((m) => m.home === match.home && m.away === match.away);
        transaction.update(matchdayRef, { matches: replaceMatchVenue(matches, index, venue) });
        if (habitual && homeTeam) {
          transaction.update(doc(db, 'teams', homeTeam.id), { [`seasonVenues.${seasonId}`]: venue });
        }
      });
      setMessage('Campo guardado. Resultado y acta sin cambios.');
    } catch (error) {
      setMessage(`No se pudo guardar el campo: ${error instanceof Error ? error.message : 'error desconocido'}`);
    } finally { setSaving(false); }
  };

  return <section className="space-y-3 min-w-0 border-b border-border pb-5">
    <h3 className="font-semibold flex items-center gap-2"><MapPin className="size-4 text-primary" />Campo del partido</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-2"><Label htmlFor="venue-name">Nombre del campo</Label><Input id="venue-name" maxLength={150} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="venue-locality">Población y provincia</Label><Input id="venue-locality" maxLength={150} value={locality} onChange={(e) => setLocality(e.target.value)} /></div>
    </div>
    <label className="flex gap-2 items-start text-sm"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />Campo exacto confirmado</label>
    {homeTeam && <label className="flex gap-2 items-start text-sm"><input type="checkbox" className="mt-1" checked={habitual} onChange={(e) => setHabitual(e.target.checked)} />También es el campo habitual de {homeTeam.name} en esta temporada</label>}
    <MatchVenueInfo match={{ ...match, venue }} />
    <Button type="button" variant="outline" className="w-full sm:w-auto h-11" disabled={saving} onClick={save}><Save />{saving ? 'Guardando campo…' : 'Guardar solo el campo'}</Button>
    {message && <p role="status" className="text-sm break-words">{message}</p>}
  </section>;
}