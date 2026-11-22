import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveMatchVenue, venueMapsUrl } from '@/lib/matchVenue';
import { useSeason } from '@/contexts/SeasonContext';
import type { Match, Team } from '@/types/league';

export function MatchVenueInfo({ match, homeTeam }: { match: Match; homeTeam?: Team }) {
  const { seasonId } = useSeason();
  const venue = resolveMatchVenue(match, homeTeam, seasonId);
  const href = venueMapsUrl(venue);
  return (
    <div className="flex min-w-0 w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs mt-2">
      <span className="inline-flex min-w-0 items-start gap-1 text-muted-foreground">
        <MapPin className="size-3.5 shrink-0 mt-0.5" />
        <span className="min-w-0 break-words">{venue ? `${venue.name} · ${venue.locality}` : `Campo por confirmar${match.venue?.locality ? ` · ${match.venue.locality}` : ''}`}
          {venue?.mapsNearbyReference && <span className="block">Maps: {venue.mapsQuery} · referencia cercana al campo</span>}
        </span>
      </span>
      {href && <Button asChild variant="link" size="sm" className="relative z-10 h-11 px-2 text-xs">
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Cómo llegar: ${venue?.name}, ${venue?.locality}${venue?.mapsNearbyReference ? `; referencia cercana: ${venue.mapsQuery}` : ''}`} onClick={(e) => e.stopPropagation()}>
          <Navigation />Cómo llegar
        </a>
      </Button>}
    </div>
  );
}