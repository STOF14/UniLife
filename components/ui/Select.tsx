import React from 'react';
import { cn } from '@/lib/utils';
import { SelectProps } from '@/lib/types';

export const Select = ({ 
  label, 
  value, 
  onChange, 
  options, 
  required = false,
  error,
  className,
  'data-testid': testId
}: SelectProps) => (
  <div className={cn('space-y-1', className)}>
    <label className="block text-sm font-medium text-white">
      {label} {required && <span className="text-[#FF453A]">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      data-testid={testId}
      className={cn(
        'w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0A84FF]',
        error && 'border-red-500 focus:border-red-500'
      )}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && (
      <p className="text-sm text-red-500">{error}</p>
    )}
  </div>
);