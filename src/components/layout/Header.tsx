import { Trophy } from 'lucide-react';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { SeasonSelector } from '@/components/layout/SeasonSelector';
import { useSeason } from '@/contexts/SeasonContext';
import type { Team } from '@/types/league';

interface HeaderProps {
  teams?: Team[];
}

export function Header({ teams = [] }: HeaderProps) {
  const { isReadOnly, season } = useSeason();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="container flex items-center justify-between h-14 px-4 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center glow-primary shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight gradient-text truncate">CAPUTBOVENSE</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">Liga Veteranos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeasonSelector />
          <NotificationSettings teams={teams} />
        </div>
      </div>
      {isReadOnly && (
        <div className="px-4 py-1 text-center text-[11px] bg-secondary/60 border-t border-white/5 text-muted-foreground">
          Modo consulta · {season?.label} finalizada
        </div>
      )}
    </header>
  );
}

