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
  const normalizedValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div
      className={cn(
        'relative h-[3px] w-full overflow-hidden bg-border/80',
        className
      )}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-text-secondary transition-all duration-760 ease-contemplative',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </div>
  );
}