import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { followTeam, unfollowTeam, isFollowing } from '@/lib/teamFollow';

interface Props {
  team: string;
  compact?: boolean;
  className?: string;
}

export function FollowTeamButton({ team, compact, className }: Props) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setFollowing(isFollowing(team));
    sync();
    window.addEventListener('followed-teams-changed', sync);
    return () => window.removeEventListener('followed-teams-changed', sync);
  }, [team]);

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (following) {
        await unfollowTeam(team);
        toast(`Has dejado de seguir a ${team}`);
      } else {
        const r = await followTeam(team);
        if (r === 'ok') toast.success(`Recibirás alertas de ${team}`, { description: 'Inicio, goles y resultado final' });
        else if (r === 'denied') toast.error('Notificaciones bloqueadas', { description: 'Actívalas en los ajustes del navegador para esta web.' });
        else if (r === 'iframe') toast.error('Abre la web en una pestaña propia para activar las alertas.');
        else if (r === 'unsupported') toast.error('Tu navegador no admite notificaciones', { description: 'En iPhone, añade la web a la pantalla de inicio primero.' });
        else toast.error('No se pudo activar las alertas. Inténtalo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  };

  const label = following ? 'Siguiendo' : 'Seguir equipo';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={following}
      aria-label={following ? `Dejar de seguir a ${team}` : `Seguir a ${team} y recibir alertas`}
      title={following ? 'Dejar de recibir alertas' : 'Recibir alertas'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0',
        compact ? 'p-1' : 'px-3 py-1.5 text-xs font-semibold border',
        following
          ? 'text-primary border-primary/40 bg-primary/10'
          : 'text-muted-foreground border-border hover:text-primary',
        className
      )}
    >
      <Star className={cn(compact ? 'w-4 h-4' : 'w-4 h-4', following && 'fill-current')} />
      {!compact && <span>{label}</span>}
    </button>
  );
}
