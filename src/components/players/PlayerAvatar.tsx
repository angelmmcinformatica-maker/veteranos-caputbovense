import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  photoUrl?: string;
  name: string;
  dorsal?: string | number | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

/** Keep the dorsal in the same circle when a stored photo is missing or cannot load. */
export function PlayerAvatar({ photoUrl, name, dorsal, className, imageClassName, fallbackClassName }: PlayerAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!photoUrl && failedUrl !== photoUrl;
  const label = dorsal !== undefined && dorsal !== null && String(dorsal).trim() !== ''
    ? String(dorsal)
    : '#';

  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', className)}
      aria-label={showPhoto ? undefined : `${name}, dorsal ${label}`}>
      {showPhoto ? (
        <img src={photoUrl} alt={name} onError={() => setFailedUrl(photoUrl)}
          className={cn('h-full w-full object-cover', imageClassName)} />
      ) : (
        <span className={cn('font-bold', fallbackClassName)} aria-hidden="true">{label}</span>
      )}
    </span>
  );
}