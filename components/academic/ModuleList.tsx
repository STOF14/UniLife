// components/academic/ModuleList.tsx
'use client';

import { Module } from '@/lib/types';
import { CaretRight, CheckCircle, SpinnerGap, CircleDashed } from 'phosphor-react';
import Link from 'next/link';

interface ModuleListProps {
  modules: Module[];
  groupByYear?: boolean;
}

export function ModuleList({ modules, groupByYear = false }: ModuleListProps) {
  // Filter out completed modules from active view
  const activeModules = modules.filter(module => 
    !(module.completed || module.currentGrade >= 100)
  );

  if (activeModules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#EBEBF599] text-sm">
          {modules.length > 0 ? 'All modules completed! View in Analytics' : 'No modules yet'}
        </p>
      </div>
    );
  }

  // Helper function to determine module status
  const getModuleStatus = (module: Module): 'completed' | 'in-progress' | 'upcoming' => {
    if (module.completed || module.currentGrade >= 100) return 'completed';
    if (module.currentGrade === 0 && (module.completedAssessments || 0) === 0) return 'upcoming';
    return 'in-progress';
  };

  // Group modules if requested
  if (groupByYear) {
    const grouped = activeModules.reduce((acc, module) => {
      const year = module.year || 1;
      if (!acc[year]) acc[year] = [];
      acc[year].push(module);
      return acc;
    }, {} as Record<number, Module[]>);

    const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);

    return (
      <div className="space-y-6">
        {sortedYears.map(year => {
          const yearModules = grouped[year];
          const completed = yearModules.filter(m => getModuleStatus(m) === 'completed');
          const inProgress = yearModules.filter(m => getModuleStatus(m) === 'in-progress');
          const upcoming = yearModules.filter(m => getModuleStatus(m) === 'upcoming');

          return (
            <div key={year} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Year {year}</h3>
                <div className="flex gap-2 text-xs">
                  {completed.length > 0 && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded inline-flex items-center gap-1">
                      <CheckCircle size={12} />
                      {completed.length} done
                    </span>
                  )}
                  {inProgress.length > 0 && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded inline-flex items-center gap-1">
                      <SpinnerGap size={12} className="animate-spin" />
                      {inProgress.length} active
                    </span>
                  )}
                  {upcoming.length > 0 && (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded inline-flex items-center gap-1">
                      <CircleDashed size={12} />
                      {upcoming.length} upcoming
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                {/* In Progress - Full opacity */}
                {inProgress.map(module => (
                  <ModuleItem key={module.id} module={module} status="in-progress" />
                ))}
                
                {/* Upcoming - Medium opacity */}
                {upcoming.map(module => (
                  <ModuleItem key={module.id} module={module} status="upcoming" />
                ))}
                
                {/* Completed - Lower opacity */}
                {completed.map(module => (
                  <ModuleItem key={module.id} module={module} status="completed" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default list view
  return (
    <div className="space-y-1">
      {activeModules.map((module) => (
        <ModuleItem key={module.id} module={module} status={getModuleStatus(module)} />
      ))}
    </div>
  );
}

function ModuleItem({ 
  module, 
  status 
}: { 
  module: Module; 
  status: 'completed' | 'in-progress' | 'upcoming';
}) {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return { label: 'Done', icon: <CheckCircle size={12} />, color: 'bg-green-500/20 text-green-400', opacity: 'opacity-60' };
      case 'in-progress':
        return { label: 'Active', icon: <SpinnerGap size={12} className="animate-spin" />, color: 'bg-blue-500/20 text-blue-400', opacity: 'opacity-100' };
      case 'upcoming':
        return { label: 'Soon', icon: <CircleDashed size={12} />, color: 'bg-gray-500/20 text-gray-400', opacity: 'opacity-50' };
    }
  };

  const badge = getStatusBadge();

  return (
    <Link
      href={`/academic/modules/${module.id}`}
      className="block group"
    >
      <div className={`bg-[#0A0A0A] hover:bg-[#1C1C1C] rounded-lg px-4 py-3 transition-all duration-200 ${badge.opacity}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <p className="text-sm font-medium text-[#EBEBF599]">{module.code}</p>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">{module.name}</p>
                <span className={`px-2 py-0.5 text-xs rounded inline-flex items-center gap-1 ${badge.color}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-[#EBEBF599]">
                {status === 'completed' ? 'Final' : 'Target'}
              </p>
              <p className={`text-sm font-medium ${
                status === 'completed' && module.currentGrade >= module.targetGrade
                  ? 'text-green-400'
                  : 'text-white'
              }`}>
                {status === 'completed' ? module.currentGrade : module.targetGrade}%
              </p>
            </div>
            <CaretRight className="h-4 w-4 text-[#EBEBF599] group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}