// components/academic/ModuleList.tsx
'use client';

import { Module } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ModuleListProps {
  modules: Module[];
}

export function ModuleList({ modules }: ModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#EBEBF599] text-sm">No modules yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {modules.map((module) => (
        <Link
          key={module.id}
          href={`/academic/modules/${module.id}`}
          className="block group"
        >
          <div className="bg-[#0A0A0A] hover:bg-[#1C1C1C] rounded-lg px-4 py-3 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <p className="text-sm font-medium text-[#EBEBF599]">{module.code}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{module.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-[#EBEBF599]">Target</p>
                  <p className="text-sm font-medium text-white">{module.targetGrade}%</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#EBEBF599] group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}