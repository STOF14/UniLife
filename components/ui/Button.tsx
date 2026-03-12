import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/lib/types';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick, 
  className = '', 
  disabled = false,
  loading = false,
  type = 'button',
  'data-testid': testId
}: ButtonProps) => {
  const variants = {
    primary: 'bg-text-primary text-background border border-text-primary hover:bg-accent-hover hover:border-accent-hover',
    secondary: 'bg-transparent border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-surface-hover/50',
    danger: 'bg-danger text-background border border-danger hover:bg-danger/90 hover:border-danger/80',
    outline: 'bg-surface/30 border border-border text-text-primary hover:border-text-secondary hover:bg-surface-hover/70'
  } as const;
  
  const sizes = {
    sm: 'h-8 px-3 text-caption uppercase tracking-[0.1em]',
    md: 'h-10 px-5 py-2 text-body-sm uppercase tracking-[0.08em]',
    lg: 'h-12 px-6 text-body-sm uppercase tracking-[0.08em]',
  } as const;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-medium transition-all duration-300 ease-contemplative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin border-b border-t border-current"></div>
      )}
      {children}
    </button>
  );
};