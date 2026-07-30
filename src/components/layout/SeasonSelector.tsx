import { ChevronDown, CalendarRange } from 'lucide-react';
import { useSeason } from '@/contexts/SeasonContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SeasonSelector() {
  const { seasons, seasonId, season, setSeasonId } = useSeason();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-medium hover:bg-secondary transition-colors"
          aria-label="Seleccionar temporada"
        >
          <CalendarRange className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">{season?.label}</span>
          <span className="sm:hidden whitespace-nowrap">{season?.shortLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[600]">
        {(seasons || []).map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setSeasonId(s.id)}
            className={s.id === seasonId ? 'font-semibold text-primary' : ''}
          >
            {s.label}
            {s.readOnly && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                Archivo
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
