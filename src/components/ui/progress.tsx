import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export function Progress({
  className,
  value = 0,
  max = 100,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  return (
    <div
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary-600 transition-all dark:bg-primary-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
} 