import React from 'react';
import { Module } from '@/lib/types';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { calculateTermAverage } from '@/lib/utils/calculations';

type AcademicProgressPageProps = {
  modules: Module[];
  cwa: string;
};

export const AcademicProgressPage = ({ modules, cwa }: AcademicProgressPageProps) => {
  const currentYear = '2025';
  const currentYearModules = modules.filter(m => m.semester === currentYear);
  const currentYearAverage = calculateTermAverage(modules, currentYear);
  const years = [...new Set(modules.map(m => m.semester))].sort();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">Academic Progress</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
          <div className="text-center mb-8">
            <div className="text-sm text-[#EBEBF599] mb-2">Cumulative Weighted Average</div>
            <div className="text-6xl font-mono font-bold text-[#0A84FF] mb-2">{cwa}%</div>
            <div className="text-xs text-[#EBEBF599]">
              Based on {modules.reduce((sum, m) => sum + m.credits, 0)} total credits
            </div>
          </div>

          <div className="space-y-6">
            {years.map(year => {
              const yearModules = modules.filter(m => m.semester === year);
              const yearAverage = calculateTermAverage(modules, year);
              const yearCredits = yearModules.reduce((sum, m) => sum + m.credits, 0);

              return (
                <div key={year} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#38383A]">
                    <h3 className="text-lg font-semibold text-white">Term {year}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-[#0A84FF]">{yearAverage}%</div>
                      <div className="text-xs text-[#EBEBF599]">{yearCredits} credits</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {yearModules.map(module => (
                      <div 
                        key={module.id} 
                        className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-white font-medium">{module.code}</div>
                          <div className="text-xs text-[#EBEBF599]">{module.credits} credits</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-mono font-semibold text-white">{module.currentGrade}%</div>
                          </div>
                          <div className="w-16 text-right">
                            <div className="text-sm font-mono text-[#0A84FF]">
                              {(module.currentGrade * module.credits).toFixed(0)}
                            </div>
                            <div className="text-[10px] text-[#EBEBF599]">weighted</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-[#0A84FF]/10 border border-[#0A84FF]/30 rounded-lg">
            <div className="text-xs text-[#EBEBF599] mb-2">Formula:</div>
            <div className="text-xs font-mono text-[#0A84FF]">
              CWA = Σ(credits × grade) / Σ(total credits)
            </div>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
          <div className="text-center mb-8">
            <div className="text-sm text-[#EBEBF599] mb-2">Current Year Average</div>
            <div className="text-6xl font-mono font-bold text-[#30D158] mb-2">{currentYearAverage}%</div>
            <div className="text-xs text-[#EBEBF599]">
              Term {currentYear} • {currentYearModules.reduce((sum, m) => sum + m.credits, 0)} credits
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Module Performance</h3>
            
            {currentYearModules.map(module => {
              const targetDiff = module.currentGrade - module.targetGrade;
              const progressToTarget = Math.min((module.currentGrade / module.targetGrade) * 100, 100);

              return (
                <div 
                  key={module.id} 
                  className="p-4 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors border border-[#38383A] hover:border-[#0A84FF]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{module.code}</div>
                      <div className="text-xs text-[#EBEBF599] line-clamp-1">{module.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing percentage={module.currentGrade} size={45} strokeWidth={4} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-[#141414] rounded">
                      <div className="text-xs text-[#EBEBF599]">Current</div>
                      <div className="text-sm font-mono font-semibold text-white">{module.currentGrade}%</div>
                    </div>
                    <div className="text-center p-2 bg-[#141414] rounded">
                      <div className="text-xs text-[#EBEBF599]">Target</div>
                      <div className="text-sm font-mono font-semibold text-white">{module.targetGrade}%</div>
                    </div>
                    <div className="text-center p-2 bg-[#141414] rounded">
                      <div className="text-xs text-[#EBEBF599]">Diff</div>
                      <div className={`text-sm font-mono font-semibold ${
                        targetDiff >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'
                      }`}>
                        {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#EBEBF599] mb-1">
                      <span>Progress to target</span>
                      <span>{Math.round(progressToTarget)}%</span>
                    </div>
                    <ProgressBar 
                      percentage={progressToTarget}
                      color={targetDiff >= 0 ? '#30D158' : '#FF9F0A'}
                      height={6}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-[#30D158]/10 border border-[#30D158]/30 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#EBEBF599] mb-1">Modules Above Target</div>
                <div className="text-2xl font-bold text-[#30D158]">
                  {currentYearModules.filter(m => m.currentGrade >= m.targetGrade).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#EBEBF599] mb-1">Average Progress</div>
                <div className="text-2xl font-bold text-[#30D158]">
                  {Math.round(currentYearModules.reduce((sum, m) => sum + m.progress, 0) / currentYearModules.length)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};