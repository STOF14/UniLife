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
      <div className="pb-6 border-b border-border mb-2">
        <p className="chapter-label mb-2">(kiseki) Trajectory</p>
        <h1 className="chapter-title">Academic Progress</h1>
        <p className="chapter-subtitle">Cumulative weighted average and module performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-6">
          <div className="text-center mb-8">
            <div className="text-sm text-text-tertiary mb-2">Cumulative Weighted Average</div>
            <div className="text-6xl font-mono font-bold text-text-primary mb-2">{cwa}%</div>
            <div className="text-xs text-text-tertiary">
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
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h3 className="text-lg font-semibold text-text-primary">Term {year}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-text-primary">{yearAverage}%</div>
                      <div className="text-xs text-text-tertiary">{yearCredits} credits</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {yearModules.map(module => (
                      <div 
                        key={module.id} 
                        className="flex items-center justify-between p-3 rounded-sm bg-background/50 hover:bg-surface/50 transition-colors duration-300 ease-contemplative"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-text-primary font-medium">{module.code}</div>
                          <div className="text-xs text-text-tertiary">{module.credits} credits</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-mono font-semibold text-text-primary">{module.currentGrade}%</div>
                          </div>
                          <div className="w-16 text-right">
                            <div className="text-sm font-mono text-text-primary">
                              {(module.currentGrade * module.credits).toFixed(0)}
                            </div>
                            <div className="text-[10px] text-text-tertiary">weighted</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-sm bg-text-primary/10 border border-text-primary/30">
            <div className="text-xs text-text-tertiary mb-2">Formula:</div>
            <div className="text-xs font-mono text-text-primary">
              CWA = Σ(credits × grade) / Σ(total credits)
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="text-center mb-8">
            <div className="text-sm text-text-tertiary mb-2">Current Year Average</div>
            <div className="text-6xl font-mono font-bold text-success mb-2">{currentYearAverage}%</div>
            <div className="text-xs text-text-tertiary">
              Term {currentYear} • {currentYearModules.reduce((sum, m) => sum + m.credits, 0)} credits
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Module Performance</h3>
            
            {currentYearModules.map(module => {
              const targetDiff = module.currentGrade - module.targetGrade;
              const progressToTarget = Math.min((module.currentGrade / module.targetGrade) * 100, 100);

              return (
                <div 
                  key={module.id} 
                  className="p-4 rounded-sm bg-background/50 hover:bg-surface/50 transition-colors duration-300 ease-contemplative border border-border/50 hover:border-border-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text-primary">{module.code}</div>
                      <div className="text-xs text-text-tertiary line-clamp-1">{module.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing percentage={module.currentGrade} size={45} strokeWidth={4} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-surface rounded">
                      <div className="text-xs text-text-tertiary">Current</div>
                      <div className="text-sm font-mono font-semibold text-text-primary">{module.currentGrade}%</div>
                    </div>
                    <div className="text-center p-2 bg-surface rounded">
                      <div className="text-xs text-text-tertiary">Target</div>
                      <div className="text-sm font-mono font-semibold text-text-primary">{module.targetGrade}%</div>
                    </div>
                    <div className="text-center p-2 bg-surface rounded">
                      <div className="text-xs text-text-tertiary">Diff</div>
                      <div className={`text-sm font-mono font-semibold ${
                        targetDiff >= 0 ? 'text-success' : 'text-danger'
                      }`}>
                        {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-text-tertiary mb-1">
                      <span>Progress to target</span>
                      <span>{Math.round(progressToTarget)}%</span>
                    </div>
                    <ProgressBar 
                      percentage={progressToTarget}
                    color={targetDiff >= 0 ? '#567045' : '#9B7A3C'}
                      height={6}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-sm bg-surface border border-success/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-text-tertiary mb-1">Modules Above Target</div>
                <div className="text-2xl font-bold text-success">
                  {currentYearModules.filter(m => m.currentGrade >= m.targetGrade).length}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary mb-1">Average Progress</div>
                <div className="text-2xl font-bold text-success">
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