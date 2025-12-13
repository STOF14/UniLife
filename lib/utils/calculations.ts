import type { Module } from '@/lib/types';

export const calculateCWA = (modules: Module[]) => {
  let totalWeightedScore = 0;
  let totalCredits = 0;

  modules.forEach(module => {
    totalCredits += module.credits;
    
    if (module.specialCode && [988, 997, 998].includes(module.specialCode)) {
      totalWeightedScore += 0;
    } else {
      totalWeightedScore += module.currentGrade * module.credits;
    }
  });

  return totalCredits > 0 ? (totalWeightedScore / totalCredits).toFixed(2) : '0.00';
};

export const calculateTermAverage = (modules: Module[], term: string) => {
  const termModules = modules.filter(m => m.semester === term);
  return calculateCWA(termModules);
};