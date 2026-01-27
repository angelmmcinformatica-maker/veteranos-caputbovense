import { cn } from '@/lib/utils';

interface FormIndicatorProps {
  result: 'W' | 'D' | 'L';
}

export function FormIndicator({ result }: FormIndicatorProps) {
  return (
    <span className={cn(
      'form-indicator',
      result === 'W' && 'form-w',
      result === 'D' && 'form-d',
      result === 'L' && 'form-l'
    )}>
      {result === 'W' ? 'V' : result === 'D' ? 'E' : 'D'}
    </span>
  );
}
