import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initMessaging, getToken } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team } from '@/types/league';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  teams: Team[];
}

interface SubscriptionData {
  token: string;
  teams: string[];
  updatedAt: string;
}

export function NotificationSettings({ teams }: NotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscribedTeams, setSubscribedTeams] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved subscriptions from localStorage
    const saved = localStorage.getItem('notification-teams');
    if (saved) {
      try {
        setSubscribedTeams(JSON.parse(saved));
      } catch {}
    }
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        const messaging = await initMessaging();
        if (messaging) {
          try {
            const token = await getToken(messaging, {
              vapidKey: '' // Needs VAPID key from Firebase Console
            });
            if (token) {
              // Save token to Firestore for server-side push
              await setDoc(doc(db, 'notification_tokens', token), {
                token,
                teams: subscribedTeams,
                updatedAt: new Date().toISOString()
              });
            }
          } catch {
            // FCM token retrieval may fail without VAPID key - still allow local notifications
          }
        }
        toast.success('Notificaciones activadas');
      } else {
        toast.error('Permiso de notificaciones denegado');
      }
    } catch {
      toast.error('Error al activar notificaciones');
    }
    setLoading(false);
  };

  const toggleTeam = (teamName: string) => {
    const updated = subscribedTeams.includes(teamName)
      ? subscribedTeams.filter(t => t !== teamName)
      : [...subscribedTeams, teamName];
    
    setSubscribedTeams(updated);
    localStorage.setItem('notification-teams', JSON.stringify(updated));
  };

  const toggleAll = () => {
    const allTeamNames = teams.map(t => t.name);
    const allSelected = allTeamNames.every(t => subscribedTeams.includes(t));
    const updated = allSelected ? [] : allTeamNames;
    setSubscribedTeams(updated);
    localStorage.setItem('notification-teams', JSON.stringify(updated));
  };

  if (!('Notification' in window)) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all',
          subscribedTeams.length > 0 && notificationsEnabled
            ? 'bg-primary/20 text-primary'
            : 'bg-secondary text-muted-foreground hover:text-foreground'
        )}
      >
        {subscribedTeams.length > 0 && notificationsEnabled ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
        {subscribedTeams.length > 0 && notificationsEnabled && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold flex items-center justify-center text-primary-foreground">
            {subscribedTeams.length}
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
                  teams.every(t => subscribedTeams.includes(t.name))
                    ? 'bg-primary border-primary'
                    : 'border-border'
                )}>
                  {teams.every(t => subscribedTeams.includes(t.name)) && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium">Todos los equipos</span>
              </button>
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.name)}
                  className="w-full p-2.5 flex items-center gap-2 hover:bg-secondary/50 transition-colors"
                >
                  <div className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                    subscribedTeams.includes(team.name)
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  )}>
                    {subscribedTeams.includes(team.name) && (
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

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}