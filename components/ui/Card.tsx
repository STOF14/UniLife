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
        'bg-surface border-t-2 transition-all duration-200 ease-swiss',
        accent ? 'border-t-text-primary' : 'border-t-transparent hover:border-t-text-tertiary',
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
      className={cn('flex flex-col gap-1 p-4', className)}
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
      className={cn('text-title-sm text-text-primary tracking-tight', className)}
      {...props}
    />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}