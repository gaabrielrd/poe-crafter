import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}
