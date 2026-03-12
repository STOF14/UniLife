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
  <div className={cn('space-y-2', className)}>
    <label className="block text-label uppercase tracking-[0.1em] text-text-muted">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      data-testid={testId}
      className={cn(
        'w-full cursor-pointer border-b border-border bg-transparent px-0 py-2.5 text-body text-text-primary focus:border-text-secondary focus:outline-none transition-colors duration-300 ease-contemplative',
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