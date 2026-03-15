'use client';

import { calculateCWA, calculateTermAverage } from '@/lib/utils/calculations';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Module } from '@/lib/types';

type AcademicProgressPageProps = {
  modules: Module[];
};

export const AcademicProgressPage = ({ modules }: AcademicProgressPageProps) => {

  const currentYear = new Date().getFullYear().toString();
  const currentYearModules = (modules || []).filter((m: Module) => m.semester === currentYear);
  const currentYearAverage = calculateTermAverage(modules || [], currentYear);
  const years = [...new Set((modules || []).map((m: Module) => m.semester))].sort() as string[];
  const cwa = calculateCWA(modules || []);

  return (
    <div className="space-y-4 page-enter">
      <div className="px-1 pb-3 border-b border-border/60">
        <p className="chapter-label">(kiseki) Trajectory</p>
        <h1 className="chapter-title">Academic Progress</h1>
      </div>

      <div className="space-y-4">
        {/* CWA Panel */}
        <div className="surface-card p-6">
          <div className="text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Cumulative Weighted Average</div>
            <div className="text-6xl font-mono font-bold text-text-primary mb-2">{cwa}%</div>
            <div className="text-xs text-text-tertiary font-mono">
              Based on {modules.reduce((sum: number, m: Module) => sum + m.credits, 0)} total credits
            </div>
          </div>

          <div className="space-y-6">
            {years.map((year: string) => {
              const yearModules = modules.filter((m: Module) => m.semester === year);
              const yearAverage = calculateTermAverage(modules, year);
              const yearCredits = yearModules.reduce((sum: number, m: Module) => sum + m.credits, 0);

              return (
                <div key={year} className="space-y-0">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <h3 className="text-[10px] uppercase tracking-[0.12em] text-text-muted">Term {year}</h3>
                    <div className="text-right">
                      <div className="text-xl font-mono font-semibold text-text-primary">{yearAverage}%</div>
                      <div className="text-xs font-mono text-text-tertiary">{yearCredits} credits</div>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {yearModules.map((module: Module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between py-3 px-2 rounded-sm hover:bg-surface-hover/50 transition-all duration-300 ease-contemplative"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-text-primary font-medium font-mono">{module.code}</div>
                          <div className="text-xs text-text-tertiary">{module.credits} credits</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-mono font-semibold text-text-primary">{module.currentGrade}%</div>
                          </div>
                          <div className="w-16 text-right">
                            <div className="text-sm font-mono text-text-secondary">
                              {(module.currentGrade * module.credits).toFixed(0)}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-text-tertiary">weighted</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Formula</div>
            <div className="text-xs font-mono text-text-secondary">
              CWA = Σ(credits × grade) / Σ(total credits)
            </div>
          </div>
        </div>

        {/* Current Year Panel */}
        <div className="surface-card p-6">
          <div className="text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Current Year Average</div>
            <div className="text-6xl font-mono font-bold text-success mb-2">{currentYearAverage}%</div>
            <div className="text-xs text-text-tertiary font-mono">
              Term {currentYear} · {currentYearModules.reduce((sum: number, m: Module) => sum + m.credits, 0)} credits
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-3">Module Performance</h3>

            {currentYearModules.map((module: Module) => {
              const targetDiff = module.currentGrade - module.targetGrade;
              const progressToTarget = Math.min((module.currentGrade / module.targetGrade) * 100, 100);

              return (
                <div
                  key={module.id}
                  className="surface-card p-4 transition-all duration-300 ease-contemplative hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text-primary font-mono">{module.code}</div>
                      <div className="text-xs text-text-tertiary line-clamp-1">{module.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressRing percentage={module.currentGrade ?? 0} size={45} strokeWidth={4} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-[1px] bg-border/60 mb-3">
                    <div className="text-center p-2 bg-surface">
                      <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Current</div>
                      <div className="text-sm font-mono font-semibold text-text-primary">{module.currentGrade}%</div>
                    </div>
                    <div className="text-center p-2 bg-surface">
                      <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Target</div>
                      <div className="text-sm font-mono font-semibold text-text-primary">{module.targetGrade}%</div>
                    </div>
                    <div className="text-center p-2 bg-surface">
                      <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Diff</div>
                      <div className={`text-sm font-mono font-semibold ${
                        targetDiff >= 0 ? 'text-success' : 'text-danger'
                      }`}>
                        {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] uppercase tracking-[0.1em] text-text-muted mb-1">
                      <span>Progress to target</span>
                      <span className="font-mono">{Math.round(progressToTarget)}%</span>
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

          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1">Modules Above Target</div>
                <div className="text-2xl font-mono font-semibold text-success">
                  {currentYearModules.filter(m => m.currentGrade >= m.targetGrade).length}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1">Average Progress</div>
                <div className="text-2xl font-mono font-semibold text-success">
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
