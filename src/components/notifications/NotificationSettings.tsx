import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initMessaging, getToken } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team } from '@/types/league';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  teams: Team[];
}

export function NotificationSettings({ teams }: NotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscribedTeamIds, setSubscribedTeamIds] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('notification-team-ids');
    if (saved) {
      try {
        setSubscribedTeamIds(JSON.parse(saved));
      } catch {}
    }
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const syncTokenToFirestore = async (teamIds: string[]) => {
    try {
      const messaging = await initMessaging();
      if (!messaging) return;
      const token = await getToken(messaging, {
        vapidKey: 'BMJk3r633eqaJdbWXgIBKKd1PaUQK0IyFKVwrdfUTQ2Rf0EKzDUYIKdD2IUR5EJ8MKeOhE78hDfES-nDq8HUX6c',
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
      });
      if (token) {
        await setDoc(doc(db, 'notification_tokens', token), {
          token,
          teams: teamIds,
          updatedAt: new Date().toISOString()
        });
      }
    } catch {
      // Token sync failed silently
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        await syncTokenToFirestore(subscribedTeamIds);
        toast.success('Notificaciones activadas');
      } else {
        toast.error('Permiso de notificaciones denegado');
      }
    } catch {
      toast.error('Error al activar notificaciones');
    }
    setLoading(false);
  };

  const toggleTeam = (teamId: string) => {
    const updated = subscribedTeamIds.includes(teamId)
      ? subscribedTeamIds.filter(id => id !== teamId)
      : [...subscribedTeamIds, teamId];
    
    setSubscribedTeamIds(updated);
    localStorage.setItem('notification-team-ids', JSON.stringify(updated));
    if (notificationsEnabled) syncTokenToFirestore(updated);
  };

  const toggleAll = () => {
    const allIds = teams.map(t => t.id);
    const allSelected = allIds.every(id => subscribedTeamIds.includes(id));
    const updated = allSelected ? [] : allIds;
    setSubscribedTeamIds(updated);
    localStorage.setItem('notification-team-ids', JSON.stringify(updated));
    if (notificationsEnabled) syncTokenToFirestore(updated);
  };

  if (!('Notification' in window)) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all',
          subscribedTeamIds.length > 0 && notificationsEnabled
            ? 'bg-primary/20 text-primary'
            : 'bg-secondary text-muted-foreground hover:text-foreground'
        )}
      >
        {subscribedTeamIds.length > 0 && notificationsEnabled ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        {subscribedTeamIds.length > 0 && notificationsEnabled && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center text-primary-foreground">
            {subscribedTeamIds.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-72 glass-card border border-border shadow-2xl animate-scale-in">
          <div className="p-3 border-b border-border/50">
            <h4 className="font-semibold text-sm">Notificaciones</h4>
            <p className="text-xs text-muted-foreground">Recibe alertas de goles y resultados</p>
          </div>

          {!notificationsEnabled ? (
            <div className="p-4 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm mb-3">Activa las notificaciones para recibir alertas de los partidos</p>
              <button
                onClick={requestPermission}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Activando...' : 'Activar notificaciones'}
              </button>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <button
                onClick={toggleAll}
                className="w-full p-2.5 flex items-center gap-2 hover:bg-secondary/50 transition-colors border-b border-border/30"
              >
                <div className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                  teams.every(t => subscribedTeamIds.includes(t.id))
                    ? 'bg-primary border-primary'
                    : 'border-border'
                )}>
                  {teams.every(t => subscribedTeamIds.includes(t.id)) && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium">Todos los equipos</span>
              </button>
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className="w-full p-2.5 flex items-center gap-2 hover:bg-secondary/50 transition-colors"
                >
                  <div className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                    subscribedTeamIds.includes(team.id)
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  )}>
                    {subscribedTeamIds.includes(team.id) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm truncate">{team.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
