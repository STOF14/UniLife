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
    primary: 'bg-[#0A84FF] hover:bg-[#409CFF] text-white',
    secondary: 'bg-[#141414] border border-[#38383A] text-[#EBEBF599] hover:border-[#0A84FF] hover:text-white',
    danger: 'bg-[#FF453A] hover:bg-[#FF6961] text-white',
    outline: 'border border-[#38383A] text-white hover:bg-[#38383A]'
  } as const;
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-lg',
  } as const;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
      )}
      {children}
    </button>
  );
};