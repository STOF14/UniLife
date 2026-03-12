import React from 'react';
import { ProgressRingProps } from '@/lib/types';

export const ProgressRing = ({ percentage, size = 80, strokeWidth = 6 }: ProgressRingProps) => {
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="butt"
          className="text-text-secondary transition-all duration-760 ease-contemplative"
        />
      </svg>
      <span className="absolute font-mono text-body font-semibold text-text-primary">{normalizedPercentage}%</span>
    </div>
  );
};