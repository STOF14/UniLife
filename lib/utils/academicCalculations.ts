// lib/utils/academicCalculations.ts
import { Module, Assessment } from '@/lib/types';

export function calculateCurrentGrade(module: Module): number {
  if (!module.assessments?.length) return 0;
  
  const gradedAssessments = module.assessments.filter(a => a.graded && a.grade !== undefined);
  if (!gradedAssessments.length) return 0;
  
  const totalWeight = gradedAssessments.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = gradedAssessments.reduce((sum, a) => {
    return sum + ((a.grade || 0) * a.weight);
  }, 0);
  
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function calculateRequiredGrade(
  module: Module,
  desiredGrade: number
): { required: number; possible: boolean } {
  const gradedAssessments = module.assessments?.filter(a => a.graded && a.grade !== undefined) || [];
  const ungradedAssessments = module.assessments?.filter(a => !a.graded || a.grade === undefined) || [];
  
  if (!ungradedAssessments.length) {
    return { required: 0, possible: false };
  }
  
  const currentWeightedGrade = calculateCurrentGrade(module) * 
    (gradedAssessments.reduce((sum, a) => sum + a.weight, 0) / 100);
  
  const remainingWeight = ungradedAssessments.reduce((sum, a) => sum + a.weight, 0);
  const requiredWeightedGrade = (desiredGrade - currentWeightedGrade) * (100 / remainingWeight);
  
  return {
    required: Math.max(0, Math.min(100, Math.round(requiredWeightedGrade * 100) / 100)),
    possible: requiredWeightedGrade <= 100
  };
}

export function calculatePredictedGrade(module: Module): number {
  if (!module.assessments?.length) return 0;
  
  const totalWeight = module.assessments.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = module.assessments.reduce((sum, a) => {
    const grade = a.graded ? (a.grade || 0) : (module.targetGrade || 0);
    return sum + (grade * a.weight);
  }, 0);
  
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function getGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 77) return 'B+';
  if (percentage >= 73) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 67) return 'C+';
  if (percentage >= 63) return 'C';
  if (percentage >= 60) return 'C-';
  if (percentage >= 57) return 'D+';
  if (percentage >= 53) return 'D';
  if (percentage >= 50) return 'D-';
  return 'F';
}

export function calculateGPA(modules: Module[]): number {
  const gradedModules = modules.filter(m => m.currentGrade !== undefined);
  if (!gradedModules.length) return 0;
  
  const totalPoints = gradedModules.reduce((sum, module) => {
    const grade = module.currentGrade || 0;
    let points = 0;
    
    if (grade >= 90) points = 4.0;
    else if (grade >= 85) points = 3.9;
    else if (grade >= 80) points = 3.7;
    else if (grade >= 77) points = 3.3;
    else if (grade >= 73) points = 3.0;
    else if (grade >= 70) points = 2.7;
    else if (grade >= 67) points = 2.3;
    else if (grade >= 63) points = 2.0;
    else if (grade >= 60) points = 1.7;
    else if (grade >= 57) points = 1.3;
    else if (grade >= 53) points = 1.0;
    else if (grade >= 50) points = 0.7;
    
    return sum + (points * (module.credits || 3));
  }, 0);
  
  const totalCredits = gradedModules.reduce((sum, m) => sum + (m.credits || 3), 0);
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}