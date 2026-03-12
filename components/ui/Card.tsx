// components/ui/Card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  accent?: boolean;
}

export function Card({ className, accent, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-surface/75 shadow-surface-soft transition-all duration-300 ease-contemplative',
        accent ? 'border-text-secondary/70' : 'border-border/80 hover:border-border-hover',
        className
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('font-display text-title-sm text-text-primary tracking-tight', className)}
      {...props}
    />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('p-4 pt-1', className)} {...props} />;
}