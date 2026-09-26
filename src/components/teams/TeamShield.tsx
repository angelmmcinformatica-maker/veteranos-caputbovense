import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TeamShield({ name, src, className }: { name: string; src?: string; className?: string }) {
  return src ? (
    <img src={src} alt={`Escudo de ${name}`} className={cn('shrink-0 object-contain', className)} />
  ) : (
    <span role="img" aria-label={`Escudo genérico de ${name}`} className={cn('shrink-0 inline-flex items-center justify-center rounded bg-secondary text-muted-foreground', className)}>
      <Shield aria-hidden="true" className="size-1/2" />
    </span>
  );
}