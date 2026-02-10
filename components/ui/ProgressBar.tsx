import React from 'react';
import { ProgressBarProps } from '@/lib/types';

export const ProgressBar = ({ percentage, height = 2, color = '#E8E8E8' }: ProgressBarProps) => (
  <div className="w-full flex items-center gap-3">
    <div className="flex-1 bg-border overflow-hidden" style={{ height: `${height}px` }}>
      <div 
        className="h-full transition-all duration-800 ease-swiss" 
        style={{ width: `${percentage}%`, backgroundColor: color }} 
      />
    </div>
    <span className="text-caption font-mono text-text-secondary min-w-[32px] text-right">{percentage}%</span>
  </div>
);