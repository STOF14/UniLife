import React from 'react';
import { ProgressRingProps } from '@/lib/types';

export const ProgressRing = ({ percentage, size = 80, strokeWidth = 6 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1E1E1E" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8E8E8" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="butt"
          className="transition-all duration-800 ease-swiss" />
      </svg>
      <span className="absolute text-body font-mono font-semibold text-text-primary">{percentage}%</span>
    </div>
  );
};