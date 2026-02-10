import React, { useMemo, useState } from 'react';
import { Module } from '@/lib/types';
import { useStore } from '@/hooks/useStore';
import { CheckCircle, Circle, TrendUp, Target, BookOpen, Calendar, ChartLineUp, WarningCircle } from 'phosphor-react';

type AnalyticsPageProps = {
  modules: Module[];
};

type YearData = {
  year: string;
  credits: number;
  modules: Module[];
  average: number;
  gradePoints: number;
  completed: boolean;
  completedCredits: number;
};

export const AnalyticsPage = ({ modules }: AnalyticsPageProps) => {
  const { academicProfile, setAcademicProfile } = useStore();
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Separate completed and future modules
  const { completedModules, futureModules } = useMemo(() => {
    const completed = modules.filter(m => m.currentGrade > 0 && m.progress === 100);
    const future = modules.filter(m => !(m.currentGrade > 0 && m.progress === 100));
    return { completedModules: completed, futureModules: future };
  }, [modules]);

  // Calculate actual CWA from completed modules
  const actualCWA = useMemo(() => {
    const totalCredits = completedModules.reduce((sum, m) => sum + m.credits, 0);
    const totalGP = completedModules.reduce((sum, m) => sum + (m.credits * m.currentGrade), 0);
    return totalCredits > 0 ? totalGP / totalCredits : 0;
  }, [completedModules]);

  // Group modules by year/semester
  const yearBreakdown = useMemo(() => {
    const grouped = modules.reduce((acc, mod) => {
      const year = mod.semester;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(mod);
      return acc;
    }, {} as Record<string, Module[]>);

    const yearData: YearData[] = Object.entries(grouped).map(([year, mods]) => {
      const credits = mods.reduce((sum, m) => sum + m.credits, 0);
      const completedMods = mods.filter(m => m.currentGrade > 0 && m.progress === 100);
      const completedCredits = completedMods.reduce((sum, m) => sum + m.credits, 0);
      
      // Use currentGrade for completed modules, targetGrade (or targetMark if present) for future
      const gradePoints = mods.reduce((sum, m) => {
        const target = (m as any).targetMark ?? m.targetGrade;
        const grade = (m.currentGrade > 0 && m.progress === 100) ? m.currentGrade : target;
        return sum + (m.credits * grade);
      }, 0);
      
      const average = credits > 0 ? gradePoints / credits : 0;
      const completed = completedCredits === credits && credits > 0;
      
      return {
        year,
        credits,
        modules: mods,
        average,
        gradePoints,
        completed,
        completedCredits
      };
    }).sort((a, b) => a.year.localeCompare(b.year));

    return yearData;
  }, [modules]);

  // Calculate overall projections
  const analysis = useMemo(() => {
    // Use actual completed data instead of manual input
    const completedCredits = completedModules.reduce((sum, m) => sum + m.credits, 0);
    const pastGP = completedModules.reduce((sum, m) => sum + (m.credits * m.currentGrade), 0);
    
    const futureCredits = futureModules.reduce((sum, m) => sum + m.credits, 0);
    const projectedGP = futureModules.reduce((sum, m) => {
      const target = (m as any).targetMark ?? m.targetGrade;
      return sum + (m.credits * target);
    }, 0);
    const projectedAverage = futureCredits > 0 ? projectedGP / futureCredits : 0;
    
    const totalCreditsFinal = completedCredits + futureCredits;
    const requiredTotalGP = totalCreditsFinal * academicProfile.targetCWA;
    const neededGP = requiredTotalGP - pastGP;
    const requiredAverage = futureCredits > 0 ? neededGP / futureCredits : 0;
    
    const finalProjectedGP = pastGP + projectedGP;
    const finalProjectedCWA = totalCreditsFinal > 0 ? finalProjectedGP / totalCreditsFinal : 0;

    return {
      completedCredits,
      futureCredits,
      projectedAverage,
      requiredAverage,
      finalProjectedCWA,
      isOnTrack: projectedAverage >= requiredAverage,
      pastGP,
      actualCWA
    };
  }, [modules, academicProfile, completedModules, futureModules, actualCWA]);

  const attendanceRate = modules.length > 0 ? (completedModules.length / modules.length) * 100 : 0;
  const goalProgress = academicProfile.targetCWA > 0
    ? Math.min((analysis.actualCWA / academicProfile.targetCWA) * 100, 100)
    : 0;

  const filteredModules = selectedYear === 'all' 
    ? modules 
    : modules.filter(m => m.semester === selectedYear);

  const getHeatColor = (grade: number) => {
    if (grade >= 75) return 'bg-success/30';
    if (grade >= 60) return 'bg-text-primary/30';
    if (grade >= 50) return 'bg-warning/30';
    return 'bg-danger/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light text-text-primary mb-2">Analytics Dashboard</h1>
        <p className="text-text-tertiary text-sm">BSc Physics with Computational Physics</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2  text-sm font-medium bg-surface border border-border text-text-primary hover:border-text-primary"
        >
          Export PDF
        </button>
      </div>

      {/* Historic Data Display (Auto-calculated from completed modules) */}
      <div className="bg-surface border border-border  p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Academic Profile</h2>
          <span className="text-xs px-3 py-1 bg-success/20 text-success ">
            Auto-calculated from completed modules
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-text-tertiary text-xs uppercase tracking-wider font-semibold mb-2 block">
              Completed Credits
            </label>
            <div className="w-full bg-background border border-border  px-4 py-3 text-2xl font-light text-text-primary">
              {analysis.completedCredits}
            </div>
          </div>
          <div>
            <label className="text-text-tertiary text-xs uppercase tracking-wider font-semibold mb-2 block">
              Current CWA (%)
            </label>
            <div className="w-full bg-background border border-border  px-4 py-3 text-2xl font-light text-text-primary">
              {analysis.actualCWA.toFixed(2)}
            </div>
          </div>
          <div>
            <label className="text-text-primary text-xs uppercase tracking-wider font-semibold mb-2 block">
              Target CWA (%)
            </label>
            <input 
              type="number" 
              //step="0.01"
              value={academicProfile.targetCWA}
              onChange={(e) => setAcademicProfile({...academicProfile, targetCWA: Number(e.target.value)})}
              className="w-full bg-background border border-text-primary/30  px-4 py-3 text-2xl font-light text-text-primary focus:outline-none focus:border-text-primary"
              placeholder="e.g., 65.00"
            />
          </div>
          <div>
            <label className="text-text-tertiary text-xs uppercase tracking-wider font-semibold mb-2 block">
              Remaining Credits
            </label>
            <div className="w-full bg-background border border-border  px-4 py-3 text-2xl font-light text-text-primary">
              {analysis.futureCredits}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border  p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-text-primary" size={20} />
            <span className="text-text-tertiary text-sm">Required Average</span>
          </div>
          <div className={`text-3xl font-bold ${analysis.isOnTrack ? 'text-success' : 'text-danger'}`}>
            {analysis.requiredAverage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-surface border border-border  p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendUp className="text-success" size={20} />
            <span className="text-text-tertiary text-sm">Projected Average</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {analysis.projectedAverage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-surface border border-border  p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-warning" size={20} />
            <span className="text-text-tertiary text-sm">Final Projected CWA</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {analysis.finalProjectedCWA.toFixed(1)}%
          </div>
        </div>

        <div className="bg-surface border border-border  p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-text-secondary" size={20} />
            <span className="text-text-tertiary text-sm">Total Credits</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {analysis.completedCredits + analysis.futureCredits}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {analysis.completedCredits} done, {analysis.futureCredits} remaining
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-border  p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-tertiary text-sm">Attendance Estimate</span>
            <span className="text-text-primary text-sm">{attendanceRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-background  overflow-hidden">
            <div className="h-full bg-success" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>
        <div className="bg-surface border border-border  p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-tertiary text-sm">Goal Progress</span>
            <span className="text-text-primary text-sm">{goalProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-background  overflow-hidden">
            <div className="h-full bg-text-primary" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border  p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Year Comparison</h2>
        <div className="space-y-3">
          {yearBreakdown.map(year => (
            <div key={year.year}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-text-tertiary">{year.year}</span>
                <span className="text-text-primary">{year.average.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-background  overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${Math.min(year.average, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border  p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Module Performance Heatmap</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {modules.map(mod => (
            <div key={mod.id} className={`p-3  border border-border ${getHeatColor(mod.currentGrade || 0)}`}>
              <div className="text-xs text-text-primary font-semibold">{mod.code}</div>
              <div className="text-[10px] text-text-tertiary truncate">{mod.name}</div>
              <div className="text-xs text-text-primary mt-1">{mod.currentGrade || 0}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      <div className={` p-6 ${analysis.isOnTrack ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-1">
              {analysis.isOnTrack ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle size={16} className="text-success" />
                  On Track to Target
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <WarningCircle size={16} className="text-warning" />
                  Below Target Pace
                </span>
              )}
            </h3>
            <p className="text-text-tertiary">
              {analysis.isOnTrack 
                ? `You're ${(analysis.projectedAverage - analysis.requiredAverage).toFixed(1)}% above the required average!`
                : `You need to improve by ${(analysis.requiredAverage - analysis.projectedAverage).toFixed(1)}% to reach your target.`
              }
            </p>
          </div>
          <div className={`px-4 py-2  text-sm font-bold ${analysis.isOnTrack ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
            {analysis.isOnTrack ? 'ON TRACK' : 'ACTION NEEDED'}
          </div>
        </div>
      </div>

      {/* Year Breakdown Tabs */}
      <div className="bg-surface border border-border  p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">Year-by-Year Breakdown</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2  text-sm font-medium transition-colors ${
                selectedYear === 'all' 
                  ? 'bg-text-primary text-background' 
                  : 'bg-border text-text-tertiary hover:bg-border'
              }`}
            >
              All Years
            </button>
            {yearBreakdown.map(year => (
              <button
                key={year.year}
                onClick={() => setSelectedYear(year.year)}
                className={`px-4 py-2  text-sm font-medium transition-colors ${
                  selectedYear === year.year 
                    ? 'bg-text-primary text-background' 
                    : 'bg-border text-text-tertiary hover:bg-border'
                }`}
              >
                {year.year}
              </button>
            ))}
          </div>
        </div>

        {/* Year Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {yearBreakdown.map(year => (
            <div 
              key={year.year}
              className={`bg-background border  p-5 hover:border-text-primary transition-colors cursor-pointer ${
                year.completed ? 'border-success/50' : 'border-border'
              }`}
              onClick={() => setSelectedYear(year.year)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-text-primary">{year.year}</h3>
                  {year.completed && <CheckCircle size={16} className="text-success" />}
                </div>
                <span className="text-xs px-2 py-1 bg-border text-text-tertiary">
                  {year.modules.length} modules
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">Credits</span>
                  <span className="text-lg font-bold text-text-primary">
                    {year.completedCredits}/{year.credits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">
                    {year.completed ? 'Actual Average' : 'Target Average'}
                  </span>
                  <span className={`text-lg font-bold ${year.completed ? 'text-success' : 'text-text-primary'}`}>
                    {year.average.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-border  overflow-hidden mt-3">
                  <div 
                    className={`h-full ${year.completed ? 'bg-success' : 'bg-text-primary'}`}
                    style={{ width: `${Math.min(year.average, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Module Details */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            {selectedYear === 'all' ? 'All Modules' : `${selectedYear} Modules`}
          </h3>
          {filteredModules.map(mod => {
            const isCompleted = mod.progress === 100;
            const target = (mod as any).targetMark ?? mod.targetGrade;
            const displayGrade = isCompleted ? mod.currentGrade : target;
            const totalCredits = selectedYear === 'all' ? 
              (analysis.completedCredits + analysis.futureCredits) : 
              yearBreakdown.find(y => y.year === selectedYear)?.credits || 1;
            const weight = (mod.credits / totalCredits) * 100;
            const contribution = (mod.credits * displayGrade);
            
            return (
              <div 
                key={mod.id} 
                className={`bg-background border p-4  hover:border-text-primary transition-colors ${
                  isCompleted ? 'border-success/30' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {isCompleted ? (
                        <CheckCircle size={18} className="text-success" />
                      ) : (
                        <Circle size={18} className="text-border" />
                      )}
                      <h4 className="text-text-primary font-semibold">{mod.code}</h4>
                      <span className="text-xs px-2 py-0.5 bg-border text-text-tertiary">
                        {mod.semester}
                      </span>
                      {isCompleted && (
                        <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-tertiary line-clamp-1">{mod.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-light text-text-primary mb-1">{displayGrade}%</div>
                    <div className="text-xs text-text-tertiary">
                      {isCompleted ? 'Achieved' : 'Target'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Credits</div>
                    <div className="text-lg font-bold text-text-primary">{mod.credits}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Weight</div>
                    <div className="text-lg font-bold text-warning">{weight.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Grade Points</div>
                    <div className="text-lg font-bold text-text-primary">{contribution.toFixed(0)}</div>
                  </div>
                </div>

                {/* Progress bar showing difficulty */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-text-tertiary">
                    <span>{isCompleted ? 'Achievement Level' : 'Target Difficulty'}</span>
                    <span>
                      {displayGrade >= 75 ? 'Distinction' : 
                       displayGrade >= 60 ? 'Pass' : 
                       displayGrade >= 50 ? 'Minimum' : 'Below Pass'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-border  overflow-hidden">
                    <div 
                      className={`h-full ${
                        displayGrade >= 75 ? 'bg-success' : 
                        displayGrade >= 60 ? 'bg-text-primary' : 
                        displayGrade >= 50 ? 'bg-warning' : 'bg-danger'
                      }`}
                      style={{ width: `${displayGrade}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Computational Physics Track Info */}
      <div className="bg-gradient-to-r from-text-primary/10 to-text-secondary/10 border border-text-primary/30  p-6">
        <h3 className="text-xl font-semibold text-text-primary mb-3 flex items-center gap-2">
          <ChartLineUp size={20} className="text-text-primary" />
          BSc Physics with Computational Physics Track
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-text-primary font-semibold mb-2">Programme Requirements</h4>
            <ul className="space-y-1 text-text-tertiary">
              <li>• Total Credits: 430 </li>
              <li>• Year 1: 142 credits minimum</li>
              <li>• Year 2: 144 credits minimum</li>
              <li>• Year 3: 144 credits minimum</li>
            </ul>
          </div>
          <div>
            <h4 className="text-text-secondary font-semibold mb-2">Computational Physics Modules</h4>
            <ul className="space-y-1 text-text-tertiary">
              <li>• COS 132, 110, 122, 151 (Year 1)</li>
              <li>• COS 210, 212, 226, 284 (Year 2)</li>
              <li>• COS 314, 344, 333, 330 (Year 3)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};