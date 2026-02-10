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
  <div className={cn('space-y-1.5', className)}>
    <label className="block text-label uppercase tracking-[0.08em] text-text-secondary">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      data-testid={testId}
      className={cn(
        'w-full bg-transparent border-b border-border px-0 py-2 text-body text-text-primary focus:outline-none focus:border-text-primary transition-colors duration-200 cursor-pointer',
        error && 'border-danger focus:border-danger'
      )}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-background text-text-primary">{opt.label}</option>
      ))}
    </select>
    {error && (
      <p className="text-caption text-danger">{error}</p>
    )}
  </div>
);