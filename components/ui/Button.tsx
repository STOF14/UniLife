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
    primary: 'bg-text-primary text-background hover:bg-accent-hover',
    secondary: 'bg-transparent border border-border text-text-secondary hover:border-text-primary hover:text-text-primary',
    danger: 'bg-danger text-white hover:bg-danger/90',
    outline: 'border border-border text-text-primary hover:border-text-secondary'
  } as const;
  
  const sizes = {
    sm: 'h-8 px-3 text-caption uppercase tracking-[0.08em]',
    md: 'h-10 px-4 py-2 text-body-sm uppercase tracking-[0.06em]',
    lg: 'h-12 px-6 text-body uppercase tracking-[0.06em]',
  } as const;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 ease-swiss focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-t border-b border-current mr-2"></div>
      )}
      {children}
    </button>
  );
};