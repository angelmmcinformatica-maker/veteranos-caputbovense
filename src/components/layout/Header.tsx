import { Trophy } from 'lucide-react';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import type { Team } from '@/types/league';

interface HeaderProps {
  teams?: Team[];
}

export function Header({ teams = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center glow-primary">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight gradient-text">CAPUTBOVENSE</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Liga Veteranos</p>
          </div>
        </div>
        <NotificationSettings teams={teams} />
      </div>
    </header>
  );
}
