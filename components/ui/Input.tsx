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
  'data-testid': testId,
  disabled
}: InputProps) => (
  <div className={cn('space-y-1.5', className)}>
    <label className="block text-label uppercase tracking-[0.08em] text-text-secondary">
      {label} {required && <span className="text-danger">*</span>}
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
      disabled={disabled}
      className={cn(
        'w-full bg-transparent border-b border-border px-0 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-primary transition-colors duration-200',
        error && 'border-danger focus:border-danger',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    />
    {error && (
      <p className="text-caption text-danger">{error}</p>
    )}
  </div>
);