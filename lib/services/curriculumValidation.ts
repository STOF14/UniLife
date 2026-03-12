// Curriculum Validation Service
// Validates module choices against curriculum requirements

import { supabaseAdmin as supabase } from '@/lib/supabase/adminClient';
import { AcademicBusinessLogic } from './academicBusinessLogic';

export interface CurriculumRequirement {
  yearLevel: number;
  semester: 'First' | 'Second' | 'Year';
  moduleCode: string;
  moduleName: string;
  credits: number;
  isCompulsory: boolean;
  moduleType: 'core' | 'fundamental' | 'elective';
  prerequisites?: string[];
}

export interface CurriculumCompliance {
  compliant: boolean;
  totalCredits: number;
  coreCredits: number;
  fundamentalCredits: number;
  electiveCredits: number;
  missingCoreModules: CurriculumRequirement[];
  missingFundamentalModules: CurriculumRequirement[];
  excessElectiveModules: string[];
  warnings: string[];
}

export interface AcademicPath {
  recommendedModules: string[];
  alternativePaths: string[][];
  estimatedDuration: number;
  creditLoadPerSemester: number[];
}

export class CurriculumValidation {
  // Validate student's module choices against curriculum
  static async validateCurriculumCompliance(
    studentProfileId: string
  ): Promise<CurriculumCompliance> {
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

      // Get curriculum requirements
      const { data: curriculumModules, error: curriculumError } = await supabase
        .from('degree_modules')
        .select(`
          *,
          modules_catalog(code, name, credits)
        `)
        .eq('curriculum_version_id', profile.curriculum_version_id)
        .order('year_level, semester');

      if (curriculumError) {
        throw new Error(`Failed to fetch curriculum: ${curriculumError.message}`);
      }

      // Get student's completed modules
      const { data: completedModules, error: completedError } = await supabase
        .from('student_module_instances')
        .select('module_code, status')
        .eq('student_profile_id', studentProfileId)
        .eq('status', 'passed');

      if (completedError) {
        throw new Error(`Failed to fetch completed modules: ${completedError.message}`);
      }

      const completedCodes = completedModules?.map(m => m.module_code) || [];

      // Analyze compliance
      const coreModules = curriculumModules?.filter(m => m.module_type === 'core') || [];
      const fundamentalModules = curriculumModules?.filter(m => m.module_type === 'fundamental') || [];
      const electiveModules = curriculumModules?.filter(m => m.module_type === 'elective') || [];

      const missingCoreModules = coreModules.filter(m => !completedCodes.includes(m.module_code));
      const missingFundamentalModules = fundamentalModules.filter(m => !completedCodes.includes(m.module_code));
      
      // Calculate credits
      const completedDetails = curriculumModules?.filter(m => completedCodes.includes(m.module_code)) || [];
      const totalCredits = completedDetails.reduce((sum, m) => sum + (m.modules_catalog?.credits || 0), 0);
      
      const coreCredits = completedDetails
        .filter(m => m.module_type === 'core')
        .reduce((sum, m) => sum + (m.modules_catalog?.credits || 0), 0);
        
      const fundamentalCredits = completedDetails
        .filter(m => m.module_type === 'fundamental')
        .reduce((sum, m) => sum + (m.modules_catalog?.credits || 0), 0);
        
      const electiveCredits = completedDetails
        .filter(m => m.module_type === 'elective')
        .reduce((sum, m) => sum + (m.modules_catalog?.credits || 0), 0);

      // Check for excess electives (beyond curriculum requirements)
      const curriculumElectiveCodes = electiveModules.map(m => m.module_code);
      const excessElectiveModules = completedCodes.filter(code => 
        !curriculumElectiveCodes.includes(code)
      );

      const warnings: string[] = [];
      
      if (excessElectiveModules.length > 0) {
        warnings.push(`Modules outside curriculum: ${excessElectiveModules.join(', ')}`);
      }

      if (missingCoreModules.length > 0) {
        warnings.push(`Missing core modules: ${missingCoreModules.map(m => m.module_code).join(', ')}`);
      }

      const compliant = missingCoreModules.length === 0 && missingFundamentalModules.length === 0;

      return {
        compliant,
        totalCredits,
        coreCredits,
        fundamentalCredits,
        electiveCredits,
        missingCoreModules: missingCoreModules.map(m => ({
          yearLevel: m.year_level,
          semester: m.semester,
          moduleCode: m.module_code,
          moduleName: m.modules_catalog?.name || m.module_code,
          credits: m.modules_catalog?.credits || 0,
          isCompulsory: m.is_compulsory,
          moduleType: m.module_type,
          prerequisites: m.prerequisites
        })),
        missingFundamentalModules: missingFundamentalModules.map(m => ({
          yearLevel: m.year_level,
          semester: m.semester,
          moduleCode: m.module_code,
          moduleName: m.modules_catalog?.name || m.module_code,
          credits: m.modules_catalog?.credits || 0,
          isCompulsory: m.is_compulsory,
          moduleType: m.module_type,
          prerequisites: m.prerequisites
        })),
        excessElectiveModules,
        warnings
      };

    } catch (error) {
      console.error('Failed to validate curriculum compliance:', error);
      throw error;
    }
  }

  // Generate recommended academic path
  static async generateAcademicPath(
    studentProfileId: string,
    maxCreditsPerSemester: number = 60
  ): Promise<AcademicPath> {
    try {
      // Get curriculum compliance
      const compliance = await this.validateCurriculumCompliance(studentProfileId);
      
      // Get student's current progress
      const progress = await AcademicBusinessLogic.calculateAcademicProgress(studentProfileId);
      
      // Get curriculum modules sorted by prerequisites
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('curriculum_version_id')
        .eq('id', studentProfileId)
        .single();

      if (!profile) {
        throw new Error(`Student profile not found: ${studentProfileId}`);
      }

      const { data: curriculumModules } = await supabase
        .from('degree_modules')
        .select(`
          *,
          modules_catalog(code, name, credits, prerequisites)
        `)
        .eq('curriculum_version_id', profile.curriculum_version_id)
        .order('year_level, semester');

      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(curriculumModules || []);
      
      // Generate topological order for modules
      const moduleOrder = this.topologicalSort(dependencyGraph);
      
      // Filter out completed modules
      const { data: completedModules } = await supabase
        .from('student_module_instances')
        .select('module_code')
        .eq('student_profile_id', studentProfileId)
        .eq('status', 'passed');

      const completedCodes = completedModules?.map(m => m.module_code) || [];
      const remainingModules = moduleOrder.filter(code => !completedCodes.includes(code));

      // Generate semester plans
      const semesters: string[][] = [];
      let currentSemester: string[] = [];
      let currentCredits = 0;

      for (const moduleCode of remainingModules) {
        const module = curriculumModules?.find(m => m.module_code === moduleCode);
        const moduleCredits = module?.modules_catalog?.credits || 0;
        
        // Check if can add to current semester
        if (currentCredits + moduleCredits <= maxCreditsPerSemester) {
          currentSemester.push(moduleCode);
          currentCredits += moduleCredits;
        } else {
          // Start new semester
          if (currentSemester.length > 0) {
            semesters.push([...currentSemester]);
            currentSemester = [moduleCode];
            currentCredits = moduleCredits;
          }
        }
      }

      // Add last semester if has modules
      if (currentSemester.length > 0) {
        semesters.push(currentSemester);
      }

      // Calculate credit load per semester
      const creditLoadPerSemester = semesters.map(semester => {
        return semester.reduce((sum, code) => {
          const module = curriculumModules?.find(m => m.module_code === code);
          return sum + (module?.modules_catalog?.credits || 0);
        }, 0);
      });

      // Generate alternative paths
      const alternativePaths = this.generateAlternativePaths(
        remainingModules,
        curriculumModules || [],
        maxCreditsPerSemester
      );

      return {
        recommendedModules: remainingModules,
        alternativePaths,
        estimatedDuration: semesters.length,
        creditLoadPerSemester
      };

    } catch (error) {
      console.error('Failed to generate academic path:', error);
      throw error;
    }
  }

  // Validate semester plan
  static async validateSemesterPlan(
    studentProfileId: string,
    semesterModules: string[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check each module individually
      for (const moduleCode of semesterModules) {
        const validation = await AcademicBusinessLogic.validateModuleAddition(
          studentProfileId,
          moduleCode
        );

        if (!validation.valid) {
          errors.push(...validation.errors.map(e => `${moduleCode}: ${e}`));
        }

        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings.map(w => `${moduleCode}: ${w}`));
        }
      }

      // Check total credit load
      const { data: moduleDetails } = await supabase
        .from('modules_catalog')
        .select('code, credits')
        .in('code', semesterModules);

      const totalCredits = moduleDetails?.reduce((sum, m) => sum + (m.credits || 0), 0) || 0;

      if (totalCredits > 60) {
        warnings.push(`Total credits (${totalCredits}) exceed recommended maximum (60)`);
      }

      if (totalCredits < 30) {
        warnings.push(`Total credits (${totalCredits}) below recommended minimum (30)`);
      }

      // Check for timetable conflicts (placeholder - would need actual schedule data)
      // This would integrate with a scheduling system

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Failed to validate semester plan:', error);
      return {
        valid: false,
        errors: ['Validation failed due to system error'],
        warnings
      };
    }
  }

  // Check graduation eligibility
  static async checkGraduationEligibility(
    studentProfileId: string
  ): Promise<{ eligible: boolean; requirements: { [key: string]: any } }> {
    try {
      const compliance = await this.validateCurriculumCompliance(studentProfileId);
      const progress = await AcademicBusinessLogic.calculateAcademicProgress(studentProfileId);

      // Get degree requirements
      const { data: profile } = await supabase
        .from('student_profiles')
        .select(`
          degrees_catalog!inner(total_credits, nqf_level, duration_years)
        `)
        .eq('id', studentProfileId)
        .single();

      if (!profile) {
        throw new Error(`Student profile not found: ${studentProfileId}`);
      }

      const degree = profile.degrees_catalog[0]; // Take first degree record

      const requirements = {
        curriculumCompliance: compliance.compliant,
        totalCreditsMet: progress.earnedCredits >= (degree?.total_credits || 0),
        minimumGPA: progress.gpa >= 2.0, // Minimum GPA requirement
        maximumDuration: false, // Would need to check actual duration
        allCoreModulesCompleted: compliance.missingCoreModules.length === 0,
        allFundamentalModulesCompleted: compliance.missingFundamentalModules.length === 0
      };

      const eligible = Object.values(requirements).every(req => req === true);

      return {
        eligible,
        requirements
      };

    } catch (error) {
      console.error('Failed to check graduation eligibility:', error);
      throw error;
    }
  }

  // Private helper methods
  private static buildDependencyGraph(modules: any[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const module of modules) {
      const prerequisites = module.modules_catalog?.prerequisites 
        ? module.modules_catalog.prerequisites.split(',').map((p: string) => p.trim())
        : [];

      graph.set(module.module_code, prerequisites);
    }

    return graph;
  }

  private static topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    function visit(node: string) {
      if (visiting.has(node)) {
        throw new Error(`Circular dependency detected involving ${node}`);
      }
      
      if (visited.has(node)) {
        return;
      }

      visiting.add(node);
      
      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(node);
      visited.add(node);
      result.push(node);
    }

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return result;
  }

  private static generateAlternativePaths(
    modules: string[],
    curriculumModules: any[],
    maxCreditsPerSemester: number
  ): string[][] {
    // Simplified alternative path generation
    // In a real implementation, this would be more sophisticated
    const alternatives: string[][] = [];

    // Alternative 1: Prioritize core modules
    const coreModules = modules.filter(code => {
      const module = curriculumModules.find(m => m.module_code === code);
      return module?.module_type === 'core';
    });

    if (coreModules.length > 0) {
      alternatives.push(coreModules);
    }

    // Alternative 2: Split into lighter semesters
    const lighterSemesters: string[][] = [];
    let currentSemester: string[] = [];
    let currentCredits = 0;

    for (const moduleCode of modules) {
      const module = curriculumModules.find(m => m.module_code === moduleCode);
      const credits = module?.modules_catalog?.credits || 0;

      if (currentCredits + credits > maxCreditsPerSemester / 2) {
        if (currentSemester.length > 0) {
          lighterSemesters.push([...currentSemester]);
          currentSemester = [moduleCode];
          currentCredits = credits;
        }
      } else {
        currentSemester.push(moduleCode);
        currentCredits += credits;
      }
    }

    if (currentSemester.length > 0) {
      lighterSemesters.push(currentSemester);
    }

    if (lighterSemesters.length > 1) {
      alternatives.push(lighterSemesters.flat());
    }

    return alternatives;
  }
}
