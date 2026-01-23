// Academic Business Logic Services
// Server-side business logic for academic operations

import { createClient } from '@supabase/supabase-js';
import { AcademicValidator } from '../validation/academic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AcademicProgress {
  totalCredits: number;
  earnedCredits: number;
  completedModules: number;
  totalModules: number;
  averageGrade: number;
  gpa: number;
  academicStanding: 'excellent' | 'good' | 'satisfactory' | 'at_risk' | 'failing';
  progressPercentage: number;
}

export interface ModuleEligibility {
  eligible: boolean;
  reason?: string;
  prerequisitesMet: string[];
  prerequisitesMissing: string[];
  corequisitesRequired: string[];
  creditsSufficient: boolean;
}

export interface CurriculumProgress {
  yearLevel: number;
  modulesCompleted: number;
  modulesTotal: number;
  creditsCompleted: number;
  creditsRequired: number;
  onTrack: boolean;
  estimatedCompletion: string;
}

export interface CurriculumModule {
  id: string;
  curriculum_version_id: string;
  module_code: string;
  year_level: number;
  semester?: string;
  is_compulsory: boolean;
  module_type: string;
  credits_override?: number;
  created_at: string;
}

export class AcademicBusinessLogic {
  // Calculate student's overall academic progress
  static async calculateAcademicProgress(studentProfileId: string): Promise<AcademicProgress> {
    try {
      // Get all module instances for the student
      const { data: moduleInstances, error: instancesError } = await supabase
        .from('student_module_instances')
        .select('*')
        .eq('student_profile_id', studentProfileId);

      if (instancesError) {
        throw new Error(`Failed to fetch module instances: ${instancesError.message}`);
      }

      if (!moduleInstances || moduleInstances.length === 0) {
        return {
          totalCredits: 0,
          earnedCredits: 0,
          completedModules: 0,
          totalModules: 0,
          averageGrade: 0,
          gpa: 0,
          academicStanding: 'satisfactory',
          progressPercentage: 0
        };
      }

      // Get module details for credit calculations
      const moduleCodes = moduleInstances.map(m => m.module_code);
      const { data: moduleDetails, error: detailsError } = await supabase
        .from('modules_catalog')
        .select('code, credits')
        .in('code', moduleCodes);

      if (detailsError) {
        throw new Error(`Failed to fetch module details: ${detailsError.message}`);
      }

      // Calculate progress metrics
      const completedModules = moduleInstances.filter(m => m.status === 'passed');
      const totalCredits = moduleDetails?.reduce((sum, m) => sum + (m.credits || 0), 0) || 0;
      const earnedCredits = completedModules.reduce((sum, m) => {
        const moduleDetail = moduleDetails?.find(d => d.code === m.module_code);
        return sum + (moduleDetail?.credits || 0);
      }, 0);

      const grades = completedModules
        .filter(m => m.grade !== null && m.grade !== undefined)
        .map(m => m.grade!);

      const averageGrade = grades.length > 0 
        ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length 
        : 0;

      const gpa = this.calculateGPA(grades);
      const academicStanding = this.determineAcademicStanding(averageGrade, gpa);
      const progressPercentage = totalCredits > 0 ? (earnedCredits / totalCredits) * 100 : 0;

      return {
        totalCredits,
        earnedCredits,
        completedModules: completedModules.length,
        totalModules: moduleInstances.length,
        averageGrade,
        gpa,
        academicStanding,
        progressPercentage
      };

    } catch (error) {
      console.error('Failed to calculate academic progress:', error);
      throw error;
    }
  }

  // Check if student is eligible to take a module
  static async checkModuleEligibility(
    studentProfileId: string,
    moduleCode: string
  ): Promise<ModuleEligibility> {
    try {
      // Get module details including prerequisites
      const { data: module, error: moduleError } = await supabase
        .from('modules_catalog')
        .select('*')
        .eq('code', moduleCode)
        .single();

      if (moduleError || !module) {
        throw new Error(`Module not found: ${moduleCode}`);
      }

      // Get student's completed modules
      const { data: completedModules, error: completedError } = await supabase
        .from('student_module_instances')
        .select('module_code')
        .eq('student_profile_id', studentProfileId)
        .eq('status', 'passed');

      if (completedError) {
        throw new Error(`Failed to fetch completed modules: ${completedError.message}`);
      }

      const completedCodes = completedModules?.map(m => m.module_code) || [];

      // Check prerequisites
      const prerequisites = module.prerequisites ? module.prerequisites.split(',').map((p: string) => p.trim()) : [];
      const prerequisitesMet = prerequisites.filter((prereq: string) => completedCodes.includes(prereq));
      const prerequisitesMissing = prerequisites.filter((prereq: string) => !completedCodes.includes(prereq));

      // Check corequisites
      const corequisites = module.corequisites ? module.corequisites.split(',').map((c: string) => c.trim()) : [];
      const corequisitesRequired = corequisites.filter((coreq: string) => !completedCodes.includes(coreq));

      // Check credit requirements (if any)
      const studentProgress = await this.calculateAcademicProgress(studentProfileId);
      const creditsSufficient = studentProgress.earnedCredits >= (module.minimum_credits || 0);

      const eligible = prerequisitesMissing.length === 0 && 
                     corequisitesRequired.length === 0 && 
                     creditsSufficient;

      return {
        eligible,
        reason: !eligible ? this.getIneligibilityReason(prerequisitesMissing, corequisitesRequired, creditsSufficient) : undefined,
        prerequisitesMet,
        prerequisitesMissing,
        corequisitesRequired,
        creditsSufficient
      };

    } catch (error) {
      console.error('Failed to check module eligibility:', error);
      throw error;
    }
  }

  // Calculate curriculum progress by year level
  static async calculateCurriculumProgress(studentProfileId: string): Promise<CurriculumProgress[]> {
    try {
      // Get student's curriculum version
      const { data: profile, error: profileError } = await supabase
        .from('student_profiles')
        .select('curriculum_version_id')
        .eq('id', studentProfileId)
        .single();

      if (profileError || !profile) {
        throw new Error(`Student profile not found: ${studentProfileId}`);
      }

      // Get curriculum modules
      const { data: curriculumModules, error: curriculumError } = await supabase
        .from('degree_modules')
        .select('*')
        .eq('curriculum_version_id', profile.curriculum_version_id)
        .order('year_level, semester');

      if (curriculumError) {
        throw new Error(`Failed to fetch curriculum: ${curriculumError.message}`);
      }

      // Group modules by year level
      const curriculumByYear: Record<number, CurriculumModule[]> = {};
      for (const module of curriculumModules || []) {
        const year = module.year_level || 1;
        if (!curriculumByYear[year]) {
          curriculumByYear[year] = [];
        }
        curriculumByYear[year].push(module);
      }

      // Get student's module instances
      const { data: moduleInstances, error: instancesError } = await supabase
        .from('student_module_instances')
        .select('*')
        .eq('student_profile_id', studentProfileId);

      if (instancesError) {
        throw new Error(`Failed to fetch module instances: ${instancesError.message}`);
      }

      // Calculate progress for each year
      const progress: CurriculumProgress[] = [];
      const completedCodes = moduleInstances?.filter(m => m.status === 'passed').map(m => m.module_code) || [];

      for (const [yearLevel, modules] of Object.entries(curriculumByYear)) {
        const year = parseInt(yearLevel);
        const modulesCompleted = modules.filter((m: CurriculumModule) => completedCodes.includes(m.module_code)).length;
        const modulesTotal = modules.length;

        // Get credits for this year
        const yearModuleCodes = modules.map((m: any) => m.module_code);
        const { data: yearModules } = await supabase
          .from('modules_catalog')
          .select('credits')
          .in('code', yearModuleCodes);

        const creditsRequired = yearModules?.reduce((sum: number, m: any) => sum + (m.credits || 0), 0) || 0;
        const creditsCompleted = modules.filter((m: any) => completedCodes.includes(m.module_code))
          .reduce((sum: number, m: any) => {
            const moduleDetail = yearModules?.find((d: any) => d.code === m.module_code);
            return sum + (moduleDetail?.credits || 0);
          }, 0);

        const onTrack = modulesCompleted >= Math.ceil(modulesTotal * 0.5); // At least 50% complete
        const estimatedCompletion = this.estimateCompletion(year, modulesCompleted, modulesTotal);

        progress.push({
          yearLevel: year,
          modulesCompleted,
          modulesTotal,
          creditsCompleted,
          creditsRequired,
          onTrack,
          estimatedCompletion
        });
      }

      return progress;

    } catch (error) {
      console.error('Failed to calculate curriculum progress:', error);
      throw error;
    }
  }

  // Validate module addition against curriculum
  static async validateModuleAddition(
    studentProfileId: string,
    moduleCode: string
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if module exists in catalog
      const { data: module, error: moduleError } = await supabase
        .from('modules_catalog')
        .select('*')
        .eq('code', moduleCode)
        .single();

      if (moduleError || !module) {
        errors.push(`Module ${moduleCode} not found in catalog`);
        return { valid: false, errors, warnings };
      }

      // Check eligibility
      const eligibility = await this.checkModuleEligibility(studentProfileId, moduleCode);
      if (!eligibility.eligible) {
        errors.push(eligibility.reason || 'Not eligible to take this module');
      }

      // Check if already enrolled
      const { data: existingInstance, error: existingError } = await supabase
        .from('student_module_instances')
        .select('*')
        .eq('student_profile_id', studentProfileId)
        .eq('module_code', moduleCode)
        .single();

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to check existing enrollment: ${existingError.message}`);
      }

      if (existingInstance) {
        errors.push(`Already enrolled in ${moduleCode} (status: ${existingInstance.status})`);
      }

      // Check curriculum alignment
      const { data: curriculumModules, error: curriculumError } = await supabase
        .from('degree_modules')
        .select('*')
        .eq('module_code', moduleCode);

      if (curriculumError) {
        throw new Error(`Failed to check curriculum: ${curriculumError.message}`);
      }

      if (!curriculumModules || curriculumModules.length === 0) {
        warnings.push(`Module ${moduleCode} is not in your curriculum - may not count towards degree`);
      }

      // Check credit load
      const currentProgress = await this.calculateAcademicProgress(studentProfileId);
      const currentSemesterCredits = await this.getCurrentSemesterCredits(studentProfileId);
      
      if (currentSemesterCredits + (module.credits || 0) > 60) { // Max 60 credits per semester
        warnings.push(`Adding this module will exceed recommended credit load (60 credits per semester)`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Failed to validate module addition:', error);
      return {
        valid: false,
        errors: ['Validation failed due to system error'],
        warnings
      };
    }
  }

  // Private helper methods
  private static calculateGPA(grades: number[]): number {
    if (grades.length === 0) return 0;
    
    // UP GPA scale (simplified)
    const gpaPoints = grades.map(grade => {
      if (grade >= 75) return 4.0; // A
      if (grade >= 70) return 3.7; // B+
      if (grade >= 60) return 3.3; // B
      if (grade >= 50) return 3.0; // C
      return 0.0; // F
    });

    return (gpaPoints.reduce((sum: number, points: number) => sum + points, 0) / gpaPoints.length);
  }

  private static determineAcademicStanding(averageGrade: number, gpa: number): AcademicProgress['academicStanding'] {
    if (averageGrade >= 75 && gpa >= 3.7) return 'excellent';
    if (averageGrade >= 65 && gpa >= 3.3) return 'good';
    if (averageGrade >= 50 && gpa >= 3.0) return 'satisfactory';
    if (averageGrade >= 40) return 'at_risk';
    return 'failing';
  }

  private static getIneligibilityReason(
    prerequisitesMissing: string[],
    corequisitesRequired: string[],
    creditsSufficient: boolean
  ): string {
    const reasons = [];
    
    if (prerequisitesMissing.length > 0) {
      reasons.push(`Missing prerequisites: ${prerequisitesMissing.join(', ')}`);
    }
    
    if (corequisitesRequired.length > 0) {
      reasons.push(`Requires corequisites: ${corequisitesRequired.join(', ')}`);
    }
    
    if (!creditsSufficient) {
      reasons.push('Insufficient credits completed');
    }
    
    return reasons.join('; ');
  }

  private static estimateCompletion(
    yearLevel: number,
    modulesCompleted: number,
    modulesTotal: number
  ): string {
    const progress = modulesTotal > 0 ? modulesCompleted / modulesTotal : 0;
    
    if (progress >= 1.0) return 'Completed';
    if (progress >= 0.8) return 'Nearly complete';
    if (progress >= 0.5) return 'On track';
    if (progress >= 0.25) return 'Behind schedule';
    return 'Significantly behind';
  }

  private static async getCurrentSemesterCredits(studentProfileId: string): Promise<number> {
    // This would need to be implemented based on current semester logic
    // For now, return 0 as placeholder
    return 0;
  }
}
