import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-border bg-card/85 p-5 text-card-foreground',
        className,
      )}
      {...props}
    />
  );
}
