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
        'relative h-[2px] w-full overflow-hidden bg-border',
        className
      )}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-text-primary transition-all duration-800 ease-swiss',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}