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

export const getGradeLetter = (grade: number): string => {
  if (grade >= 90) return 'A+';
  if (grade >= 85) return 'A';
  if (grade >= 80) return 'A-';
  if (grade >= 75) return 'B+';
  if (grade >= 70) return 'B';
  if (grade >= 65) return 'B-';
  if (grade >= 60) return 'C+';
  if (grade >= 55) return 'C';
  if (grade >= 50) return 'C-';
  if (grade >= 45) return 'D+';
  if (grade >= 40) return 'D';
  return 'F';
};