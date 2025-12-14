import React from 'react';
import { ButtonProps } from '@/lib/types'

export const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button',
  'data-testid': testId
}: ButtonProps) => {
  const variants = {
    primary: 'bg-[#0A84FF] hover:bg-[#409CFF] text-white',
    secondary: 'bg-[#141414] border border-[#38383A] text-[#EBEBF599] hover:border-[#0A84FF] hover:text-white',
    danger: 'bg-[#FF453A] hover:bg-[#FF6961] text-white'
  } as const;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};