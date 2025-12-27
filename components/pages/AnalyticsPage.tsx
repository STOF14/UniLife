import React, { useMemo, useState } from 'react';
import { Module } from '@/lib/types';
import { useStore } from '@/hooks/useStore';
import { CheckCircle, Circle } from 'lucide-react'; // or 'react-feather' or your icon library
import { TrendingUp, Target, BookOpen, Calendar } from 'lucide-react';

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

  const filteredModules = selectedYear === 'all' 
    ? modules 
    : modules.filter(m => m.semester === selectedYear);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light text-white mb-2">Analytics Dashboard</h1>
        <p className="text-[#EBEBF599] text-sm">BSc Physics with Computational Physics</p>
      </div>

      {/* Historic Data Display (Auto-calculated from completed modules) */}
      <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Academic Profile</h2>
          <span className="text-xs px-3 py-1 bg-[#30D158]/20 text-[#30D158] rounded-full">
            Auto-calculated from completed modules
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[#EBEBF599] text-xs uppercase tracking-wider font-semibold mb-2 block">
              Completed Credits
            </label>
            <div className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-3 text-2xl font-light text-white">
              {analysis.completedCredits}
            </div>
          </div>
          <div>
            <label className="text-[#EBEBF599] text-xs uppercase tracking-wider font-semibold mb-2 block">
              Current CWA (%)
            </label>
            <div className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-3 text-2xl font-light text-white">
              {analysis.actualCWA.toFixed(2)}
            </div>
          </div>
          <div>
            <label className="text-[#0A84FF] text-xs uppercase tracking-wider font-semibold mb-2 block">
              Target CWA (%)
            </label>
            <input 
              type="number" 
              //step="0.01"
              value={academicProfile.targetCWA}
              onChange={(e) => setAcademicProfile({...academicProfile, targetCWA: Number(e.target.value)})}
              className="w-full bg-[#0A0A0A] border border-[#0A84FF]/30 rounded-lg px-4 py-3 text-2xl font-light text-white focus:outline-none focus:border-[#0A84FF]"
              placeholder="e.g., 65.00"
            />
          </div>
          <div>
            <label className="text-[#EBEBF599] text-xs uppercase tracking-wider font-semibold mb-2 block">
              Remaining Credits
            </label>
            <div className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-3 text-2xl font-light text-white">
              {analysis.futureCredits}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-[#0A84FF]" size={20} />
            <span className="text-[#EBEBF599] text-sm">Required Average</span>
          </div>
          <div className={`text-3xl font-bold ${analysis.isOnTrack ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
            {analysis.requiredAverage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-[#30D158]" size={20} />
            <span className="text-[#EBEBF599] text-sm">Projected Average</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {analysis.projectedAverage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-[#FF9F0A]" size={20} />
            <span className="text-[#EBEBF599] text-sm">Final Projected CWA</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {analysis.finalProjectedCWA.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-[#BF5AF2]" size={20} />
            <span className="text-[#EBEBF599] text-sm">Total Credits</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {analysis.completedCredits + analysis.futureCredits}
          </div>
          <div className="text-xs text-[#EBEBF599] mt-1">
            {analysis.completedCredits} done, {analysis.futureCredits} remaining
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-6 ${analysis.isOnTrack ? 'bg-[#30D158]/10 border border-[#30D158]/30' : 'bg-[#FF453A]/10 border border-[#FF453A]/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {analysis.isOnTrack ? '✓ On Track to Target' : '⚠ Below Target Pace'}
            </h3>
            <p className="text-[#EBEBF599]">
              {analysis.isOnTrack 
                ? `You're ${(analysis.projectedAverage - analysis.requiredAverage).toFixed(1)}% above the required average!`
                : `You need to improve by ${(analysis.requiredAverage - analysis.projectedAverage).toFixed(1)}% to reach your target.`
              }
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg text-sm font-bold ${analysis.isOnTrack ? 'bg-[#30D158]/20 text-[#30D158]' : 'bg-[#FF453A]/20 text-[#FF453A]'}`}>
            {analysis.isOnTrack ? 'ON TRACK' : 'ACTION NEEDED'}
          </div>
        </div>
      </div>

      {/* Year Breakdown Tabs */}
      <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Year-by-Year Breakdown</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === 'all' 
                  ? 'bg-[#0A84FF] text-white' 
                  : 'bg-[#38383A] text-[#EBEBF599] hover:bg-[#444444]'
              }`}
            >
              All Years
            </button>
            {yearBreakdown.map(year => (
              <button
                key={year.year}
                onClick={() => setSelectedYear(year.year)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === year.year 
                    ? 'bg-[#0A84FF] text-white' 
                    : 'bg-[#38383A] text-[#EBEBF599] hover:bg-[#444444]'
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
              className={`bg-[#0A0A0A] border rounded-lg p-5 hover:border-[#0A84FF] transition-colors cursor-pointer ${
                year.completed ? 'border-[#30D158]/50' : 'border-[#38383A]'
              }`}
              onClick={() => setSelectedYear(year.year)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{year.year}</h3>
                  {year.completed && <CheckCircle size={16} className="text-[#30D158]" />}
                </div>
                <span className="text-xs px-2 py-1 bg-[#38383A] rounded text-[#EBEBF599]">
                  {year.modules.length} modules
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#EBEBF599]">Credits</span>
                  <span className="text-lg font-bold text-white">
                    {year.completedCredits}/{year.credits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#EBEBF599]">
                    {year.completed ? 'Actual Average' : 'Target Average'}
                  </span>
                  <span className={`text-lg font-bold ${year.completed ? 'text-[#30D158]' : 'text-[#0A84FF]'}`}>
                    {year.average.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#38383A] rounded-full overflow-hidden mt-3">
                  <div 
                    className={`h-full ${year.completed ? 'bg-[#30D158]' : 'bg-[#0A84FF]'}`}
                    style={{ width: `${Math.min(year.average, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Module Details */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">
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
                className={`bg-[#0A0A0A] border p-4 rounded-lg hover:border-[#0A84FF] transition-colors ${
                  isCompleted ? 'border-[#30D158]/30' : 'border-[#38383A]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {isCompleted ? (
                        <CheckCircle size={18} className="text-[#30D158]" />
                      ) : (
                        <Circle size={18} className="text-[#38383A]" />
                      )}
                      <h4 className="text-white font-semibold">{mod.code}</h4>
                      <span className="text-xs px-2 py-0.5 bg-[#38383A] rounded text-[#EBEBF599]">
                        {mod.semester}
                      </span>
                      {isCompleted && (
                        <span className="text-xs px-2 py-0.5 bg-[#30D158]/20 text-[#30D158] rounded">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#EBEBF599] line-clamp-1">{mod.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-light text-white mb-1">{displayGrade}%</div>
                    <div className="text-xs text-[#EBEBF599]">
                      {isCompleted ? 'Achieved' : 'Target'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-[#EBEBF599] mb-1">Credits</div>
                    <div className="text-lg font-bold text-white">{mod.credits}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#EBEBF599] mb-1">Weight</div>
                    <div className="text-lg font-bold text-[#FF9F0A]">{weight.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#EBEBF599] mb-1">Grade Points</div>
                    <div className="text-lg font-bold text-[#0A84FF]">{contribution.toFixed(0)}</div>
                  </div>
                </div>

                {/* Progress bar showing difficulty */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#EBEBF599]">
                    <span>{isCompleted ? 'Achievement Level' : 'Target Difficulty'}</span>
                    <span>
                      {displayGrade >= 75 ? 'Distinction' : 
                       displayGrade >= 60 ? 'Pass' : 
                       displayGrade >= 50 ? 'Minimum' : 'Below Pass'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#38383A] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        displayGrade >= 75 ? 'bg-[#30D158]' : 
                        displayGrade >= 60 ? 'bg-[#0A84FF]' : 
                        displayGrade >= 50 ? 'bg-[#FF9F0A]' : 'bg-[#FF453A]'
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
      <div className="bg-gradient-to-r from-[#0A84FF]/10 to-[#BF5AF2]/10 border border-[#0A84FF]/30 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-3">
          📊 BSc Physics with Computational Physics Track
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-[#0A84FF] font-semibold mb-2">Programme Requirements</h4>
            <ul className="space-y-1 text-[#EBEBF599]">
              <li>• Total Credits: 430 </li>
              <li>• Year 1: 142 credits minimum</li>
              <li>• Year 2: 144 credits minimum</li>
              <li>• Year 3: 144 credits minimum</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#BF5AF2] font-semibold mb-2">Computational Physics Modules</h4>
            <ul className="space-y-1 text-[#EBEBF599]">
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