// components/ui/Progress.tsx
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
}: ProgressProps) {
  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        className
      )}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-blue-500 transition-all',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}