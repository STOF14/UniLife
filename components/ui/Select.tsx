import React from 'react';
import { SelectProps } from '@/lib/types';

export const Select = ({ 
  label, 
  value, 
  onChange, 
  options, 
  required = false,
  'data-testid': testId
}: SelectProps) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label} {required && <span className="text-[#FF453A]">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      data-testid={testId}
      className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0A84FF]"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);