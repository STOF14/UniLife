import React from 'react';
import { ProgressBarProps } from '@/lib/types';

export const ProgressBar = ({ percentage, height = 4, color = '#0A84FF' }: ProgressBarProps) => (
  <div className="w-full bg-[#38383A] rounded-full overflow-hidden" style={{ height: `${height}px` }}>
    <div className="h-full rounded-full transition-all duration-800 ease-out" 
      style={{ width: `${percentage}%`, backgroundColor: color }} />
  </div>
);