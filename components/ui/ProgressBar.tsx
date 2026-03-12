import React from 'react';
import { ProgressBarProps } from '@/lib/types';

export const ProgressBar = ({ percentage, height = 3, color = '#2E2D29' }: ProgressBarProps) => {
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));

  return (
  <div className="flex w-full items-center gap-3">
    <div className="flex-1 overflow-hidden bg-border/80" style={{ height: `${height}px` }}>
      <div 
        className="h-full transition-all duration-760 ease-contemplative" 
        style={{ width: `${normalizedPercentage}%`, backgroundColor: color }} 
      />
    </div>
    <span className="min-w-[36px] text-right font-mono text-caption text-text-muted">{normalizedPercentage}%</span>
  </div>
  );
};