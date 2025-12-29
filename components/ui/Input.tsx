import React from 'react';
import { cn } from '@/lib/utils';
import { InputProps } from '@/lib/types';

export const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  step,
  min,
  max,
  inputMode,
  error,
  className,
  'data-testid': testId
}: InputProps) => (
  <div className={cn('space-y-1', className)}>
    <label className="block text-sm font-medium text-white">
      {label} {required && <span className="text-[#FF453A]">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      step={step}
      min={min}
      max={max}
      inputMode={inputMode}
      data-testid={testId}
      className={cn(
        'w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0A84FF]',
        error && 'border-red-500 focus:border-red-500'
      )}
    />
    {error && (
      <p className="text-sm text-red-500">{error}</p>
    )}
  </div>
);