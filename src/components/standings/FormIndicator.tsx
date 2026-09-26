import { cn } from '@/lib/utils';

interface FormIndicatorProps {
  result: 'W' | 'D' | 'L' | '?';
}

export function FormIndicator({ result }: FormIndicatorProps) {
  const label = result === 'W' ? 'Victoria' : result === 'D' ? 'Empate' : result === 'L' ? 'Derrota' : 'Sin resultado';
  return (
    <span className={cn(
      'form-indicator',
      result === 'W' && 'form-w',
      result === 'D' && 'form-d',
      result === 'L' && 'form-l',
      result === '?' && 'form-unknown'
    )} aria-label={label} title={label}>
      {result === 'W' ? 'V' : result === 'D' ? 'E' : result === 'L' ? 'D' : '?'}
    </span>
  );
}
