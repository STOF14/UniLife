// Progress Analytics Service
// Advanced academic progress calculations and analytics

import { createClient } from '@supabase/supabase-js';
import { AcademicBusinessLogic, AcademicProgress } from './academicBusinessLogic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ProgressMetrics {
  currentGPA: number;
  cumulativeGPA: number;
  semesterGPA: number;
  academicStanding: string;
  classRank?: number;
  classSize?: number;
  percentile?: number;
}

export interface CreditMetrics {
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  creditsThisSemester: number;
  creditsThisYear: number;
  averageCreditsPerSemester: number;
  onTrackForGraduation: boolean;
  estimatedGraduationDate: string;
}

export interface ModulePerformance {
  moduleCode: string;
  moduleName: string;
  credits: number;
  grade: number;
  gpaPoints: number;
  semester: string;
  year: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  performance: 'excellent' | 'good' | 'satisfactory' | 'poor';
}

export interface ProgressTrend {
  semester: string;
  gpa: number;
  credits: number;
  modulesCompleted: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface GraduationProjection {
  onTime: boolean;
  estimatedSemesters: number;
  estimatedDate: string;
  requiredCreditsPerSemester: number;
  riskFactors: string[];
  recommendations: string[];
}

export class ProgressAnalytics {
  // Calculate comprehensive progress metrics
  static async calculateProgressMetrics(
    studentProfileId: string
  ): Promise<ProgressMetrics> {
    try {
      // Get basic academic progress
      const basicProgress = await AcademicBusinessLogic.calculateAcademicProgress(studentProfileId);

      // Calculate semester-specific GPA
      const semesterGPA = await this.calculateSemesterGPA(studentProfileId);
      
      // Calculate cumulative GPA (all attempts)
      const cumulativeGPA = await this.calculateCumulativeGPA(studentProfileId);

      // Determine academic standing
      const academicStanding = this.determineAcademicStanding(basicProgress.gpa, semesterGPA);

      // Get class ranking (if available)
      const classRanking = await this.getClassRanking(studentProfileId);

      return {
        currentGPA: basicProgress.gpa,
        cumulativeGPA,
        semesterGPA,
        academicStanding,
        classRank: classRanking.rank,
        classSize: classRanking.size,
        percentile: classRanking.percentile
      };

    } catch (error) {
      console.error('Failed to calculate progress metrics:', error);
      throw error;
    }
  }

  // Calculate credit metrics and graduation tracking
  static async calculateCreditMetrics(
    studentProfileId: string
  ): Promise<CreditMetrics> {
    try {
      // Get student profile for degree requirements
      const { data: profile } = await supabase
        .from('student_profiles')
        .select(`
          start_year,
          degrees_catalog!inner(total_credits, duration_years)
        `)
        .eq('id', studentProfileId)
        .single();

      if (!profile) {
        throw new Error(`Student profile not found: ${studentProfileId}`);
      }

      const degree = (profile as any)?.degrees_catalog;

      // Get all module instances
      const { data: moduleInstances } = await supabase
        .from('student_module_instances')
        .select('*')
        .eq('student_profile_id', studentProfileId);

      // Get module details for credit calculations
      const moduleCodes = moduleInstances?.map(m => m.module_code) || [];
      const { data: moduleDetails } = await supabase
        .from('modules_catalog')
        .select('code, credits')
        .in('code', moduleCodes);

      // Calculate credit metrics
      const passedModules = moduleInstances?.filter(m => m.status === 'passed') || [];
      const totalCreditsEarned = passedModules.reduce((sum, m) => {
        const detail = moduleDetails?.find(d => d.code === m.module_code);
        return sum + (detail?.credits || 0);
      }, 0);

      const totalCreditsAttempted = moduleInstances?.reduce((sum, m) => {
        const detail = moduleDetails?.find(d => d.code === m.module_code);
        return sum + (detail?.credits || 0);
      }, 0) || 0;

      // Calculate current semester and year credits
      const currentYear = new Date().getFullYear();
      const currentSemester = this.getCurrentSemester();
      
      const creditsThisSemester = await this.getCreditsForPeriod(
        studentProfileId,
        currentYear,
        currentSemester
      );

      const creditsThisYear = await this.getCreditsForYear(studentProfileId, currentYear);

      // Calculate average credits per semester
      const semestersCompleted = this.calculateSemestersCompleted(profile.start_year);
      const averageCreditsPerSemester = semestersCompleted > 0 
        ? totalCreditsEarned / semestersCompleted 
        : 0;

      // Graduation tracking
      const totalRequired = degree?.total_credits || 0;
      const onTrackForGraduation = totalCreditsEarned >= this.getExpectedCredits(
        profile.start_year,
        degree?.duration_years || 4
      );

      const estimatedGraduationDate = this.estimateGraduationDate(
        totalCreditsEarned,
        totalRequired,
        averageCreditsPerSemester
      );

      return {
        totalCreditsEarned,
        totalCreditsAttempted,
        creditsThisSemester,
        creditsThisYear,
        averageCreditsPerSemester,
        onTrackForGraduation,
        estimatedGraduationDate
      };

    } catch (error) {
      console.error('Failed to calculate credit metrics:', error);
      throw error;
    }
  }

  // Analyze module performance patterns
  static async analyzeModulePerformance(
    studentProfileId: string
  ): Promise<ModulePerformance[]> {
    try {
      // Get completed modules with details
      const { data: moduleInstances } = await supabase
        .from('student_module_instances')
        .select(`
          *,
          modules_catalog(code, name, credits)
        `)
        .eq('student_profile_id', studentProfileId)
        .eq('status', 'passed')
        .not('grade', 'is', null);

      if (!moduleInstances || moduleInstances.length === 0) {
        return [];
      }

      // Analyze each module
      const performance: ModulePerformance[] = moduleInstances.map(instance => {
        const grade = instance.grade!;
        const gpaPoints = this.gradeToGPAPoints(grade);
        const difficulty = this.assessDifficulty(grade, instance.modules_catalog?.credits || 0);
        const performance = this.assessPerformance(grade);

        return {
          moduleCode: instance.module_code,
          moduleName: instance.modules_catalog?.name || instance.module_code,
          credits: instance.modules_catalog?.credits || 0,
          grade,
          gpaPoints,
          semester: this.extractSemester(instance.created_at),
          year: this.extractYear(instance.created_at),
          difficulty,
          performance
        };
      });

      return performance;

    } catch (error) {
      console.error('Failed to analyze module performance:', error);
      throw error;
    }
  }

  // Calculate progress trends over time
  static async calculateProgressTrends(
    studentProfileId: string
  ): Promise<ProgressTrend[]> {
    try {
      // Get module instances grouped by semester
      const { data: moduleInstances } = await supabase
        .from('student_module_instances')
        .select('created_at, grade, status')
        .eq('student_profile_id', studentProfileId)
        .eq('status', 'passed')
        .not('grade', 'is', null)
        .order('created_at');

      if (!moduleInstances || moduleInstances.length === 0) {
        return [];
      }

      // Group by semester
      const semesterGroups = this.groupBySemester(moduleInstances);
      
      // Calculate trends for each semester
      const trends: ProgressTrend[] = [];
      let previousGPA = 0;

      for (const [semester, instances] of Object.entries(semesterGroups)) {
        const grades = instances.map(i => i.grade!).filter(g => g !== null);
        const gpa = grades.length > 0 
          ? grades.reduce((sum, grade) => sum + this.gradeToGPAPoints(grade), 0) / grades.length 
          : 0;

        const credits = await this.getCreditsForInstances(instances);
        const modulesCompleted = instances.length;

        // Determine trend
        let trend: 'improving' | 'stable' | 'declining';
        if (previousGPA === 0) {
          trend = 'stable';
        } else if (gpa > previousGPA + 0.1) {
          trend = 'improving';
        } else if (gpa < previousGPA - 0.1) {
          trend = 'declining';
        } else {
          trend = 'stable';
        }

        trends.push({
          semester,
          gpa,
          credits,
          modulesCompleted,
          trend
        });

        previousGPA = gpa;
      }

      return trends;

    } catch (error) {
      console.error('Failed to calculate progress trends:', error);
      throw error;
    }
  }

  // Generate graduation projection
  static async generateGraduationProjection(
    studentProfileId: string
  ): Promise<GraduationProjection> {
    try {
      // Get current progress and credit metrics
      const progress = await AcademicBusinessLogic.calculateAcademicProgress(studentProfileId);
      const creditMetrics = await this.calculateCreditMetrics(studentProfileId);

      // Get degree requirements
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('start_year, degrees_catalog!inner(total_credits, duration_years)')
        .eq('id', studentProfileId)
        .single();

      if (!profile) {
        throw new Error(`Student profile not found: ${studentProfileId}`);
      }

      const degree = (profile as any)?.degrees_catalog;
      const totalRequired = degree?.total_credits || 0;
      const durationYears = degree?.duration_years || 4;

      // Calculate projection
      const creditsRemaining = totalRequired - creditMetrics.totalCreditsEarned;
      const semestersRemaining = Math.ceil(creditsRemaining / Math.max(creditMetrics.averageCreditsPerSemester, 1));
      const estimatedSemesters = Math.min(semestersRemaining, durationYears * 2); // Max 2 semesters per year

      const onTime = estimatedSemesters <= (durationYears * 2 - this.getCurrentSemesterIndex());

      // Calculate estimated graduation date
      const currentDate = new Date();
      const graduationDate = new Date(currentDate);
      graduationDate.setMonth(graduationDate.getMonth() + (estimatedSemesters * 6)); // 6 months per semester

      // Identify risk factors
      const riskFactors: string[] = [];
      if (progress.gpa < 2.0) riskFactors.push('Low GPA may affect graduation');
      if (creditMetrics.averageCreditsPerSemester < 30) riskFactors.push('Low credit load may delay graduation');
      if (!creditMetrics.onTrackForGraduation) riskFactors.push('Behind expected credit progress');
      if (estimatedSemesters > durationYears * 2) riskFactors.push('Exceeding normal program duration');

      // Generate recommendations
      const recommendations: string[] = [];
      if (creditMetrics.averageCreditsPerSemester < 45) {
        recommendations.push('Consider increasing credit load to 45-60 credits per semester');
      }
      if (progress.gpa < 3.0) {
        recommendations.push('Focus on improving GPA through academic support services');
      }
      if (riskFactors.length > 0) {
        recommendations.push('Meet with academic advisor to discuss graduation plan');
      }

      return {
        onTime,
        estimatedSemesters,
        estimatedDate: graduationDate.toISOString().split('T')[0],
        requiredCreditsPerSemester: Math.ceil(creditsRemaining / Math.max(estimatedSemesters, 1)),
        riskFactors,
        recommendations
      };

    } catch (error) {
      console.error('Failed to generate graduation projection:', error);
      throw error;
    }
  }

  // Private helper methods
  private static async calculateSemesterGPA(studentProfileId: string): Promise<number> {
    const currentYear = new Date().getFullYear();
    const currentSemester = this.getCurrentSemester();

    const { data: instances } = await supabase
      .from('student_module_instances')
      .select('grade')
      .eq('student_profile_id', studentProfileId)
      .eq('status', 'passed')
      .not('grade', 'is', null);

    // Filter for current semester (simplified - would need proper semester tracking)
    const grades = instances?.map(i => i.grade!).filter(g => g !== null) || [];
    
    return grades.length > 0 
      ? grades.reduce((sum, grade) => sum + this.gradeToGPAPoints(grade), 0) / grades.length 
      : 0;
  }

  private static async calculateCumulativeGPA(studentProfileId: string): Promise<number> {
    const { data: instances } = await supabase
      .from('student_module_instances')
      .select('grade')
      .eq('student_profile_id', studentProfileId)
      .not('grade', 'is', null);

    const grades = instances?.map(i => i.grade!).filter(g => g !== null) || [];
    
    return grades.length > 0 
      ? grades.reduce((sum, grade) => sum + this.gradeToGPAPoints(grade), 0) / grades.length 
      : 0;
  }

  private static determineAcademicStanding(gpa: number, semesterGPA: number): string {
    if (gpa >= 3.7 && semesterGPA >= 3.7) return 'Dean\'s List';
    if (gpa >= 3.3) return 'Good Standing';
    if (gpa >= 2.0) return 'Satisfactory Standing';
    if (gpa >= 1.0) return 'Academic Probation';
    return 'Academic Suspension';
  }

  private static async getClassRanking(studentProfileId: string): Promise<{
    rank: number;
    size: number;
    percentile: number;
  }> {
    // This would require class ranking data
    // For now, return placeholder
    return {
      rank: 0,
      size: 0,
      percentile: 0
    };
  }

  private static gradeToGPAPoints(grade: number): number {
    if (grade >= 75) return 4.0;
    if (grade >= 70) return 3.7;
    if (grade >= 60) return 3.3;
    if (grade >= 50) return 3.0;
    return 0.0;
  }

  private static assessDifficulty(grade: number, credits: number): 'easy' | 'moderate' | 'challenging' {
    if (grade >= 70) return 'easy';
    if (grade >= 60) return 'moderate';
    return 'challenging';
  }

  private static assessPerformance(grade: number): 'excellent' | 'good' | 'satisfactory' | 'poor' {
    if (grade >= 75) return 'excellent';
    if (grade >= 65) return 'good';
    if (grade >= 50) return 'satisfactory';
    return 'poor';
  }

  private static getCurrentSemester(): string {
    const month = new Date().getMonth();
    return month >= 0 && month <= 6 ? 'First' : 'Second';
  }

  private static getCurrentSemesterIndex(): number {
    const month = new Date().getMonth();
    return month >= 0 && month <= 6 ? 1 : 2;
  }

  private static async getCreditsForPeriod(
    studentProfileId: string,
    year: number,
    semester: string
  ): Promise<number> {
    // Simplified - would need proper date filtering
    return 0;
  }

  private static async getCreditsForYear(
    studentProfileId: string,
    year: number
  ): Promise<number> {
    // Simplified - would need proper date filtering
    return 0;
  }

  private static calculateSemestersCompleted(startYear: number): number {
    const currentYear = new Date().getFullYear();
    const currentSemester = this.getCurrentSemesterIndex();
    const yearsCompleted = currentYear - startYear;
    return (yearsCompleted * 2) + currentSemester - 1;
  }

  private static getExpectedCredits(startYear: number, durationYears: number): number {
    const semestersCompleted = this.calculateSemestersCompleted(startYear);
    const totalSemesters = durationYears * 2;
    const expectedCreditsPerSemester = 45; // Average assumption
    return Math.min(
      semestersCompleted * expectedCreditsPerSemester,
      totalSemesters * expectedCreditsPerSemester
    );
  }

  private static estimateGraduationDate(
    creditsEarned: number,
    creditsRequired: number,
    averageCreditsPerSemester: number
  ): string {
    if (averageCreditsPerSemester === 0) return 'Unable to estimate';
    
    const creditsRemaining = creditsRequired - creditsEarned;
    const semestersRemaining = Math.ceil(creditsRemaining / averageCreditsPerSemester);
    
    const graduationDate = new Date();
    graduationDate.setMonth(graduationDate.getMonth() + (semestersRemaining * 6));
    
    return graduationDate.toISOString().split('T')[0];
  }

  private static extractSemester(dateString: string): string {
    const date = new Date(dateString);
    const month = date.getMonth();
    return month >= 0 && month <= 6 ? 'First' : 'Second';
  }

  private static extractYear(dateString: string): number {
    return new Date(dateString).getFullYear();
  }

  private static groupBySemester(instances: any[]): Record<string, any[]> {
    return instances.reduce((groups, instance) => {
      const semester = `${this.extractYear(instance.created_at)}-${this.extractSemester(instance.created_at)}`;
      if (!groups[semester]) groups[semester] = [];
      groups[semester].push(instance);
      return groups;
    }, {});
  }

  private static async getCreditsForInstances(instances: any[]): Promise<number> {
    const moduleCodes = instances.map(i => i.module_code);
    const { data: moduleDetails } = await supabase
      .from('modules_catalog')
      .select('credits')
      .in('code', moduleCodes);

    return moduleDetails?.reduce((sum, m) => sum + (m.credits || 0), 0) || 0;
  }
}
