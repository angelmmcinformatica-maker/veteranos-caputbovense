import { Home, Trophy, Calendar, BarChart3, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'standings' | 'matches' | 'stats' | 'admin';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const navItems: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Inicio' },
  { id: 'standings', icon: Trophy, label: 'Clasificación' },
  { id: 'matches', icon: Calendar, label: 'Partidos' },
  { id: 'stats', icon: BarChart3, label: 'Stats' },
  { id: 'admin', icon: Shield, label: 'Admin' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn('nav-item flex-1', activeTab === id && 'active')}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
